import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Read raw body as text — needed for signature verification
  const body = await req.text()
  const signature = req.headers.get('Tl-Signature') ?? ''
  const webhookSecret = Deno.env.get('TRUELAYER_WEBHOOK_SECRET') ?? ''

  // TODO: Verify the webhook signature
  // Use the Web Crypto API (built into Deno — no imports needed).
  // Steps:
  //   1. Import the webhook secret as an HMAC-SHA256 key using crypto.subtle.importKey()
  //   2. Sign the raw body string using crypto.subtle.sign()
  //   3. Convert the result to a hex string
  //   4. Compare it to the incoming `signature` header
  //   5. If they don't match, return a 401 response


  const isValid = await verifySignature(body, signature, webhookSecret)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  const payload = JSON.parse(body)
  console.log('TrueLayer webhook received:', payload.type)

  // Use service role key — no user JWT, so RLS is bypassed
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    secretKeys['default'] ?? '',
  )

  // Fetch all bank connections (one user for now — see PLAN.md)
  const { data: connections, error } = await supabase
    .from('bank_connections')
    .select('id, access_token, refresh_token, token_expires_at')

  if (error || !connections?.length) {
    console.log('No bank connections found:', error?.message)
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  // For each connection, fetch and upsert transactions
  for (const connection of connections) {
    let accessToken = connection.access_token

    if (new Date(connection.token_expires_at) < new Date()) {
      const refreshRes = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('TRUELAYER_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('TRUELAYER_CLIENT_SECRET') ?? '',
          refresh_token: connection.refresh_token,
        }),
      })
      const refreshed = await refreshRes.json()
      await supabase
        .from('bank_connections')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq('id', connection.id)
      accessToken = refreshed.access_token
    }

    const accountsRes = await fetch('https://api.truelayer-sandbox.com/data/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const accountsData = await accountsRes.json()

    for (const account of accountsData.results ?? []) {
      const txRes = await fetch(
        `https://api.truelayer-sandbox.com/data/v1/accounts/${account.account_id}/transactions`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      const txData = await txRes.json()

      const rows = (txData.results ?? []).map((tx: any) => ({
        bank_connection_id: connection.id,
        truelayer_transaction_id: tx.transaction_id,
        amount: Math.round(tx.amount * 100),
        currency: tx.currency,
        merchant_name: tx.description,
        transaction_at: tx.timestamp,
      }))

      await supabase.from('transactions').upsert(rows, {
        onConflict: 'bank_connection_id,truelayer_transaction_id',
        ignoreDuplicates: true,
      })
    }
  }

  // Always return 200 — TrueLayer will retry if it doesn't get one
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign']
  )

  const result = await crypto.subtle.sign('HMAC', key, encoder.encode(body))

  const hex = Array.from(new Uint8Array(result))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return hex === signature  
}
