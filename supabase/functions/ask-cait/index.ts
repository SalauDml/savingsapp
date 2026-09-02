import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Worked examples, not just described rules — shown as the actual
// input/output pairs the model needs to produce, in the same JSON shape
// Call 1 always returns. Module-level (not rebuilt per request) since it's
// identical for every call. Chosen to cover every query "shape" the app's
// own suggestion chips and home screen questions actually need, not picked
// arbitrarily.
const FEW_SHOT_EXAMPLES = [
  { role: 'user', content: 'How much did I spend on Groceries last month?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Single category, one calendar month. Join to categories, filter by exact name, restrict transaction_at to last month, sum amount.',
    sql: "SELECT SUM(t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.name = 'Groceries' AND t.transaction_at >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND t.transaction_at < date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'How much did I spend this month?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "No category named, so total across all spending categories. Default to kind = 'spending', restrict to the current calendar month.",
    sql: "SELECT SUM(t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.transaction_at >= date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'What did I spend at Tesco?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Merchant name, not category. Use ILIKE for a case-insensitive partial match since merchant strings vary. No date range given, so sum across all time.',
    sql: "SELECT SUM(t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.merchant_name ILIKE '%tesco%'",
  }) },

  { role: 'user', content: 'How much did I spend on coffee last month?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "'Coffee' isn't a category, but likely maps to coffee-shop merchants — match merchant_name against common ones instead of declining.",
    sql: "SELECT SUM(t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND (t.merchant_name ILIKE '%coffee%' OR t.merchant_name ILIKE '%costa%' OR t.merchant_name ILIKE '%starbucks%' OR t.merchant_name ILIKE '%cafe%' OR t.merchant_name ILIKE '%pret%') AND t.transaction_at >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND t.transaction_at < date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'Compare this week to last week.' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "Comparing two periods means grouping by week so both totals come back in one query. Default to kind = 'spending' since no category or income/transfer is mentioned.",
    sql: "SELECT date_trunc('week', t.transaction_at) AS week_start, SUM(t.amount) AS total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.transaction_at >= NOW() - INTERVAL '2 weeks' GROUP BY week_start ORDER BY week_start DESC",
  }) },

  { role: 'user', content: "What's my biggest expense?" },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Asks which category has the highest total spend, not a single number. Group by category, sum, order highest first.',
    sql: "SELECT c.name, SUM(t.amount) AS total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' GROUP BY c.name ORDER BY total DESC LIMIT 5",
  }) },

  { role: 'user', content: 'Am I over budget?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "Needs actual spend so far this month per category compared against each category's budgeted amount — join budgets to categories, then to this month's transactions.",
    sql: "SELECT c.name, b.amount AS budgeted, SUM(t.amount) AS spent FROM budgets b JOIN categories c ON b.category_id = c.id LEFT JOIN transactions t ON t.category_id = c.id AND t.transaction_at >= date_trunc('month', CURRENT_DATE) GROUP BY c.name, b.amount",
  }) },

  // A follow-up, shown as it actually arrives at inference time: prior turns
  // as plain-English history (exactly what the client sends), only the
  // final turn needing the reasoning+sql shape.
  { role: 'user', content: 'How much did I spend on Entertainment last month?' },
  { role: 'assistant', content: 'You spent £84.20 on Entertainment last month.' },
  { role: 'user', content: 'What about this week?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Follow-up with no new category named — reuse Entertainment from the previous question, only the date range changes.',
    sql: "SELECT SUM(t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.name = 'Entertainment' AND t.transaction_at >= date_trunc('week', CURRENT_DATE)",
  }) },

  // A meta-question about the previous answer's own scope, not new data —
  // this is exactly the case that used to trigger a fresh (wrong) query.
  // The answer is already implied by the prior turn; no query needed.
  { role: 'user', content: 'How much did I spend on Transport?' },
  { role: 'assistant', content: 'You spent £152.48 on Transport.' },
  { role: 'user', content: 'In what time range?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "This asks about the previous answer's own scope, not new data — that question had no date filter, so it covered all time. No new query needed.",
    sql: null,
  }) },

  // Deliberately out of scope: a forecast/projection question. A wrong
  // guess here isn't cosmetic — it's a spending app telling a student they
  // can afford something they can't. No single query can honestly compute
  // this, so declining is the correct answer, not an approximation.
  { role: 'user', content: 'Will I make it to end of term?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'This needs a forecast — average spend so far, days remaining, budget remaining — not something a single query can reliably answer. Decline rather than guess.',
    sql: null,
  }) },
]

Deno.serve(async (req) => {
    // Short id per invocation so concurrent requests from different users
    // don't interleave into an unreadable log — same idiom as categorise-backlog.
    const reqId = crypto.randomUUID().slice(0, 8)

    const authHeader = req.headers.get('Authorization')

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}' )
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        secretKeys['default'] ?? '',
        {global: {headers: {Authorization: authHeader ?? ''} } }

    )
    
    const jwt = authHeader?.replace('Bearer ', '') ?? ''
    const {data: {user} } = await supabase.auth.getUser(jwt)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), {
  status: 401 })
    }

    const { question, history } = await req.json()

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing question' }), {
  status: 400 })
    }

    const rawHistory = Array.isArray(history) ? history : []
    const sanitisedHistory = rawHistory
        .filter((m:any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
        .slice(-6)
        .map((m: any) => ({ role: m.role, content:m.content}))

    // PROBE 1 — confirm what's actually reaching the model: is history
    // present, and how many turns survived sanitisation vs what the client
    // claimed to send. This is the line that proves (or disproves) that
    // follow-up questions have a topic to anchor to.
    console.log(`[${reqId}] question="${question}" | history received=${Array.isArray(history) ? history.length : 0} sanitised=${sanitisedHistory.length}`)
    // The count alone doesn't tell us whether the history is actually
    // relevant, or the model has legitimate reason to be confused (multiple
    // unrelated topics in view) versus dropping a clear thread. Log the
    // actual content so a case like this is diagnosable from one log, not
    // a guess.
    console.log(`[${reqId}] history content=${JSON.stringify(sanitisedHistory)}`)

    // The real category names — same pattern as categorise-transactions.
    // Without this, the model has to guess a name from the question's
    // wording alone ("bills and subscriptions" → WHERE c.name IN ('bills',
    // 'subscriptions')), which matches zero real rows named "Bills &
    // Subscriptions" and fails silently: the query still runs, SUM() over
    // no matching rows returns NULL, and Call 2 reports that as "no
    // transactions" — a plausible-sounding answer for the wrong reason.
    const { data: categories } = await supabase.from('categories').select('name, kind')
    const categoryList = (categories ?? []).map((c) => `- ${c.name} (${c.kind})`).join('\n')

    console.log(`[${reqId}] categories offered=${categories?.length ?? 0}`)

    const schemaPrompt = `You write PostgreSQL SELECT queries for a UK
  budgeting app called SaveMyMoney.

  Only these tables exist for you to query:

  transactions (id, category_id, amount, currency, merchant_name,
  transaction_at)
    - amount is an integer in pence (e.g. 550 = £5.50).
  categories (id, name, kind)
    - kind is one of: 'spending', 'income', 'transfer'. Join
  transactions.category_id = categories.id to filter or group by this.
    - Default to kind = 'spending' for any question about spending, totals,
  or comparisons — this is a spending app, assume that's what's meant unless
  the question is clearly about income, transfers, or a non-spending case
  (e.g. "how much did I get paid"). Never skip this filter just because the
  question doesn't use the word "spend".
    - The exact category names that currently exist — match c.name against
  one of these verbatim, never guess, split, or abbreviate one:
${categoryList}
  budgets (id, category_id, amount, period)
    - amount in pence, period is currently always 'monthly'.

  Rules:
  - Write exactly one PostgreSQL SELECT statement. No other statement types,
  no semicolon at the end, no comments.
  - Never write WHERE user_id = ... or reference any user/auth column — there
  isn't one on these tables, and you don't need one. The database already
  scopes every row to whoever is asking.
  - Only use the tables and columns listed above. If the question can't be
  answered with them, use sql: null instead of guessing.
  - If a question refers to an item, brand, or theme with no matching
  category (e.g. "coffee", "Netflix", "takeaway"), match merchant_name
  against likely keywords with ILIKE/OR instead of declining. Only use
  sql: null if no reasonable merchant pattern can be inferred at all.
  - If the question asks about a PREVIOUS answer's own details (e.g. "in
  what time range?", "which category was that?") rather than requesting new
  data, use sql: null — that answer comes from conversation history, not a
  new query.
  - In reasoning, briefly note which tables, columns, filters and aggregation
  the question needs — work this out before writing sql, not at the same time.`

const sqlRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        // Structured Outputs, not plain JSON mode: this constrains the
        // model's actual token generation to this schema, not just a
        // request to follow it. reasoning is listed before sql on purpose
        // — autoregressive generation means the model's own reasoning
        // tokens are already in context by the time it writes sql, which
        // is what actually gets the "think before answering" effect,
        // not the field merely existing.
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sql_response',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                reasoning: { type: 'string' },
                sql: { type: ['string', 'null'] },
              },
              required: ['reasoning', 'sql'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0,
        messages: [
          { role: 'system', content: schemaPrompt },
          ...FEW_SHOT_EXAMPLES,
          ...sanitisedHistory,
          { role: 'user', content: question },
        ],
      }),
    })

    const sqlData = await sqlRes.json()

    // PROBE 2 — the actual SQL the model wrote (or the sql: null it chose
    // instead), plus the reasoning that led there. The single most useful
    // line in this function: it tells you immediately whether the model
    // misunderstood the question, versus the DB layer correctly rejecting a
    // reasonable-looking query. finish_reason is worth watching too —
    // "length" means the response got cut off before finishing, which
    // would break the JSON.parse right below.
    console.log(`[${reqId}] call 1 finish_reason=${sqlData.choices?.[0]?.finish_reason} | raw=${sqlData.choices?.[0]?.message?.content}`)

    const { reasoning, sql } = JSON.parse(sqlData.choices[0].message.content)
    console.log(`[${reqId}] call 1 reasoning="${reasoning}"`)

    // Stays null when Call 1 decided no query was needed (e.g. a question
    // about the previous answer's own details, not new data) — that case
    // now falls through to Call 2 instead of returning early, so it gets a
    // chance to answer from history. Only reassigned when there's an actual
    // query to run.
    let rows: unknown = null

    if (sql) {
      // Execute through the same JWT-scoped client used above — this call
      // carries the user's own JWT, so auth.uid() inside execute_cait_query
      // resolves to them, and RLS scopes every row exactly as it does
      // anywhere else in the app. Nothing about this call trusts the SQL
      // text itself; every safety property here comes from the DB layer
      // already built and tested — cait_reader's GRANTs, RLS, the
      // SECURITY DEFINER function.
      const { data, error: queryError } = await supabase.rpc('execute_cait_query', { query: sql })

      if (queryError) {
        // Don't leak the raw Postgres error back to the client — it can
        // reveal exactly how the safety layer is built (which tables it
        // blocks, the grant structure), which is useful information handed
        // to exactly the wrong audience. Log it server-side, answer
        // generically to the client. This one still short-circuits — an
        // execution failure is a different case to "no query needed", and
        // there's nothing useful for Call 2 to do with it.
        console.error('execute_cait_query failed', { sql, message: queryError.message })
        return new Response(JSON.stringify({
          answer: "I couldn't work that out — try asking a different way.",
        }), { headers: { 'Content-Type': 'application/json' } })
      }

      rows = data

      // PROBE 3 — did execute_cait_query actually return the shape expected?
      // Logs the actual row content, not just a count: without this, a
      // discrepancy between these numbers and what Call 2 says can never be
      // told apart from data that genuinely changed between the two calls —
      // there'd be nothing to compare Call 2's answer against after the fact.
      console.log(`[${reqId}] execute_cait_query ok | ${Array.isArray(rows) ? rows.length : 0} row(s) | ${JSON.stringify(rows)}`)
    } else {
      console.log(`[${reqId}] no sql — skipping execute_cait_query, letting call 2 try to answer from history`)
    }

    // Call 2: turn the raw rows into a plain-English answer.
    const answerPrompt = `You are CAIT, a friendly budgeting assistant for a UK student's spending app.

You'll be given the user's original question, the raw query results that answer it (as JSON), and —
before that — the recent conversation leading up to it.

Write a short, plain-English answer using ONLY the data provided — never invent or assume a number
that isn't in the results or already stated earlier in the conversation. Amounts are in pence;
convert to £ (e.g. 550 → "£5.50").

Some questions aren't asking for new data at all — they're asking about the PREVIOUS answer's own
details (e.g. "in what time range?", "which category was that?", "what did you just say?"). For
those, answer directly from the conversation history rather than treating the current query results
as if they answer it — the results in front of you may be unrelated or empty for a question like this.

If the results are empty and the question isn't one of those history questions, say so honestly
rather than guessing — e.g. "You don't have any transactions in that category yet."

Keep it conversational and brief — one or two sentences, not a report.`

    const answerRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: answerPrompt },
          ...sanitisedHistory,
          { role: 'user', content: JSON.stringify({ question, results: rows }) },
        ],
      }),
    })

    const answerData = await answerRes.json()
    const answer = answerData.choices[0].message.content

    // PROBE 4 — the final plain-English answer actually sent back to the app.
    console.log(`[${reqId}] call 2 answer="${answer}"`)

    return new Response(JSON.stringify({ answer }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
)