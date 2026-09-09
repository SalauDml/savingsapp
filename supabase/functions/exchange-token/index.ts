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
  console.log('code received, length:', code?.length ?? 0)

  // Must match connect-bank.tsx's REDIRECT_URI exactly (including the
  // trailing slash) - OAuth2 requires the token endpoint's redirect_uri to
  // be identical to the one used to obtain the code, or Monzo rejects the
  // exchange. This is the static GitHub Pages landing page, not
  // cait://auth/callback directly - see connect-bank.tsx's REDIRECT_URI
  // comment for why.
  const tokenRes = await fetch('https://api.monzo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: Deno.env.get('MONZO_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('MONZO_CLIENT_SECRET') ?? '',
      code:code,
      redirect_uri: 'https://salaudml.github.io/cait-oauth-redirect/',
    }),
  })

  const tokens = await tokenRes.json()
  // Never log the actual access_token/refresh_token - they're live
  // credentials that grant full read access to a real bank account, and
  // Supabase's function logs are a broader-access surface than the DB
  // itself (retention, export, anyone with dashboard access). Log enough to
  // debug a failed exchange without ever writing the secret values out.
  console.log('monzo token response ok:', tokenRes.ok, '| token_type:', tokens.token_type, '| expires_in:', tokens.expires_in, '| error:', tokens.error)

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
    .upsert({
      user_id: user.id,
      // Monzo's token response doesn't include a provider/bank name field
      // (unlike TrueLayer's `tokens.provider`) - there's nothing to pick
      // between, since this OAuth client only ever talks to Monzo.
      bank_name: 'Monzo',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    // onConflict: 'user_id' relies on the unique constraint added in
    // migration 20260904000001 - without it, re-connecting (e.g. after a
    // revoked token forces a re-auth) would insert a second row instead of
    // replacing this one, which fetch-transactions' .single() can't handle.
    }, { onConflict: 'user_id' })

  if (dbError) {
    console.log('db error:', dbError.message, '| code:', dbError.code, '| details:', dbError.details)
    return new Response(JSON.stringify({ error: dbError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
