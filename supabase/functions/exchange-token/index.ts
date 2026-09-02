import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')

  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    secretKeys['default'] ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )

  const { code } = await req.json()
  console.log('code received:', code)

  const tokenRes = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: Deno.env.get('TRUELAYER_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('TRUELAYER_CLIENT_SECRET') ?? '',
      code,
      redirect_uri: 'cait://auth/callback',
    }),
  })

  const tokens = await tokenRes.json()
  console.log('truelayer response:', JSON.stringify(tokens))

  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: tokens }), { status: 400 })
  }

  const jwt = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)

  if (!user) {
    return new Response(JSON.stringify({ error: 'no user', detail: userError?.message }), { status: 401 })
  }

  const { error: dbError } = await supabase
    .from('bank_connections')
    .insert({
      user_id: user.id,
      bank_name: tokens.provider ?? 'Unknown',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: '2026-01-01T00:00:00Z',
    })

  if (dbError) {
    console.log('db error:', dbError.message, '| code:', dbError.code, '| details:', dbError.details)
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
