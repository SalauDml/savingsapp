import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    const authHeader = req.headers.get('Authorization')

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}' )
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        secretKeys['default'] ?? '',
        {global : {headers : { Authorization: authHeader ?? ''}}}
    )

    // Verify who's calling this function
    const jwt = authHeader?.replace('Bearer ', '') ?? ''
    const {data : {user}} = await supabase.auth.getUser(jwt)

    if (!user) {
        return new Response(JSON.stringify({error: 'Unauthorised' }), {status: 401})
    }

    // Get their stored Truelayer access_token
    const {data: connection } = await supabase 
        .from('bank_connections')
        .select('id, access_token, refresh_token, token_expires_at')
        .eq('user_id', user.id)
        .single()
    
    if (!connection) {
        return new Response(JSON.stringify({error: "No bank connnection"}), {status: 404})
    }

    //Step 2b
    // CHeck if access token is expired

    let accesstoken = connection.access_token

    if (new Date(connection.token_expires_at) < new Date()) {
        const refreshRes = await fetch (`https://auth.truelayer-sandbox.com/connect/token`, {
            method:'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: Deno.env.get('TRUELAYER_CLIENT_ID') ?? '',
                client_secret: Deno.env.get('TRUELAYER_CLIENT_SECRET')?? '',
                refresh_token: connection.refresh_token  
            })
    })
    const refreshed = await refreshRes.json()
    console.log('refreshres response:', refreshed)

    const {error: updateError} = await supabase
        .from('bank_connections')
        .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        })
        .eq('user_id', user.id)
    
    console.log('update error:', JSON.stringify(updateError))

        accesstoken = refreshed.access_token
        

    }

    
    // Step 3: fetch accounts from TrueLayer
    // Todo - you write this part (see below)

    const accountsRes = await fetch (`https://api.truelayer-sandbox.com/data/v1/accounts`, 
        {headers: { Authorization: `Bearer ${accesstoken}`}}
    )
    const accountsData = await accountsRes.json()
    console.log('truelayer accounts response:', JSON.stringify(accountsData))
    const accounts = accountsData.results

    // Step 4: fetch transactions for the primary account and upsert.
    //
    // Deliberately single-account, not a loop over every account TrueLayer
    // hands back: this app tracks "how much can I spend," which is one
    // current account, not a net-worth view across accounts. Summing
    // multiple accounts would double-count money moved between your own
    // accounts (e.g. savings -> current shows as both an expense and
    // income) unless that's explicitly detected and excluded — real
    // complexity this app doesn't need. See the 2026-09-02 migration for
    // the account_id column this now relies on to keep the one account's
    // transactions distinguishable from anything already in the table.
    const account = accounts[0]

    if (!account) {
      return new Response(JSON.stringify({ error: 'No accounts on this connection' }), { status: 404 })
    }

    const txRes = await fetch(
      `https://api.truelayer-sandbox.com/data/v1/accounts/${account.account_id}/transactions`,
      { headers: { Authorization: `Bearer ${accesstoken}` } }
    )

    const txData = await txRes.json()

    const rows = txData.results.map((tx: any) => ({
      bank_connection_id: connection.id,
      truelayer_transaction_id: tx.transaction_id,
      account_id: account.account_id,
      amount: Math.round(tx.amount * 100),
      currency: tx.currency,
      merchant_name: tx.description,
      transaction_at: tx.timestamp,
    }))

    await supabase.from('transactions').upsert(rows, {
      onConflict: 'bank_connection_id,truelayer_transaction_id,account_id',
      ignoreDuplicates: true,
    })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})