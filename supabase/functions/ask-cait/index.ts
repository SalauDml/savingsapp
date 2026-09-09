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
    reasoning: 'Single category, one calendar month. Join to categories, filter by exact name, restrict transaction_at to last month. Spending rows store amount as negative (money out), so negate the sum to return a positive pence-spent figure.',
    sql: "SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.name = 'Groceries' AND t.transaction_at >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND t.transaction_at < date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'How much did I spend this month?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "No category named, so total across all spending categories. Default to kind = 'spending', restrict to the current calendar month, negate the sum since spending rows are stored as negative amounts.",
    sql: "SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.transaction_at >= date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'What did I spend at Tesco?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Merchant name, not category. Use ILIKE for a case-insensitive partial match since merchant strings vary. No date range given, so sum across all time — negated, as with any spending total.',
    sql: "SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.merchant_name ILIKE '%tesco%'",
  }) },

  { role: 'user', content: 'How much did I spend on coffee last month?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "'Coffee' isn't a category, but likely maps to coffee-shop merchants — match merchant_name against common ones instead of declining. Negate the sum, as with any spending total.",
    sql: "SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND (t.merchant_name ILIKE '%coffee%' OR t.merchant_name ILIKE '%costa%' OR t.merchant_name ILIKE '%starbucks%' OR t.merchant_name ILIKE '%cafe%' OR t.merchant_name ILIKE '%pret%') AND t.transaction_at >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND t.transaction_at < date_trunc('month', CURRENT_DATE)",
  }) },

  { role: 'user', content: 'Compare this week to last week.' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "Comparing two periods means grouping by week so both totals come back in one query. Default to kind = 'spending' since no category or income/transfer is mentioned; negate the sum so both totals are positive pence-spent figures, comparable at a glance.",
    sql: "SELECT date_trunc('week', t.transaction_at) AS week_start, SUM(-t.amount) AS total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.transaction_at >= NOW() - INTERVAL '2 weeks' GROUP BY week_start ORDER BY week_start DESC",
  }) },

  // This is the case that was silently backwards before: ORDER BY total DESC
  // on a raw (un-negated) sum ranks the SMALLEST spender first, because
  // spending rows are stored as negative amounts — DESC on negative numbers
  // sorts closest-to-zero first. Negating before the sum, not after, means
  // "biggest expense" and every other ranking/comparison downstream (budget
  // checks included) can just use plain DESC/> like the numbers were always
  // positive, without Call 2 having to reason about sign at all.
  { role: 'user', content: "What's my biggest expense?" },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Asks which category has the highest total spend, not a single number. Group by category, negate and sum so each total is a positive pence-spent figure, then order highest first — ordering DESC on the raw sum would rank the smallest spender first, since spending rows are stored as negative amounts.',
    sql: "SELECT c.name, SUM(-t.amount) AS total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' GROUP BY c.name ORDER BY total DESC LIMIT 5",
  }) },

  // Category mode: budgets has no period column any more — the shared
  // period for every category budget is a fact injected into the schema
  // prompt (see schemaPrompt below), not something to read per-row.
  { role: 'user', content: 'Am I over budget?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "This user's active budget mode is category, so compare actual spend per category against each category's budgeted amount — join budgets to categories, then to transactions since the start of the injected period. Negate the summed spend so it's a positive pence figure directly comparable to budgets.amount, which is always stored positive.",
    sql: "SELECT c.name, b.amount AS budgeted, SUM(-t.amount) AS spent FROM budgets b JOIN categories c ON b.category_id = c.id LEFT JOIN transactions t ON t.category_id = c.id AND t.transaction_at >= date_trunc('week', CURRENT_DATE) GROUP BY c.name, b.amount",
  }) },

  // Same category-mode routing as above, but the question never says
  // "budget" — this is the paraphrase case that used to slip through and
  // default to overall_budgets regardless of mode. "Can I afford it" only
  // has one honest source of an answer given the tables available (there's
  // no account-balance table), so it's still a budget question, just
  // scoped to the one category the question implies rather than all of them.
  { role: 'user', content: "I wanna go out to eat tonight, can I afford it?" },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "Affordability language ('can I afford it') is a budget question even without the word 'budget' — 'eat out' maps to the Eating Out category. Mode is category, so check budgets joined to categories for that one category, plus transactions for actual spend — not overall_budgets, and not a claim in reasoning about whether a budget row exists before the query runs.",
    sql: "SELECT c.name, b.amount AS budgeted, SUM(-t.amount) AS spent FROM budgets b JOIN categories c ON b.category_id = c.id LEFT JOIN transactions t ON t.category_id = c.id AND t.transaction_at >= date_trunc('week', CURRENT_DATE) WHERE c.name = 'Eating Out' GROUP BY c.name, b.amount",
  }) },

  // Overall mode: exactly one row in overall_budgets, so scalar subqueries
  // avoid any join-duplication risk — a JOIN against transactions here
  // would multiply the single budget row by however many transactions
  // exist, silently wrecking the aggregate.
  { role: 'user', content: 'Am I over budget?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "This user's active budget mode is overall, not category — there's one number in overall_budgets, not a per-category split. Use scalar subqueries for the budget and its period, and a separate period-scoped, negated SUM for spend — directly comparable to overall_budgets.amount, and the single budget row is never joined against many transaction rows.",
    sql: "SELECT (SELECT amount FROM overall_budgets) AS budgeted, (SELECT period FROM overall_budgets) AS period, (SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.kind = 'spending' AND t.transaction_at >= date_trunc('week', CURRENT_DATE)) AS spent",
  }) },

  // Mode mismatch: the question is shaped like a per-category budget
  // question, but the user's active mode is overall, so there's no
  // Groceries-specific budget to report. Answering honestly beats
  // declining outright — return both the overall number and that
  // category's actual spend, so Call 2 can explain the mismatch using
  // real data instead of either guessing or refusing to help.
  { role: 'user', content: "How's my Groceries budget doing?" },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "Active mode is overall, so there is no per-category Groceries budget — budgets only has rows when mode is category. Rather than declining, return the one overall budget plus this category's actual spend (negated, so it's a positive pence figure) so the answer can explain there's no category-specific budget while still being useful.",
    sql: "SELECT (SELECT amount FROM overall_budgets) AS overall_budgeted, (SELECT period FROM overall_budgets) AS period, (SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.name = 'Groceries' AND t.transaction_at >= date_trunc('week', CURRENT_DATE)) AS groceries_spend",
  }) },

  // A follow-up, shown as it actually arrives at inference time: prior turns
  // as plain-English history (exactly what the client sends), only the
  // final turn needing the reasoning+sql shape.
  { role: 'user', content: 'How much did I spend on Entertainment last month?' },
  { role: 'assistant', content: 'You spent £84.20 on Entertainment last month.' },
  { role: 'user', content: 'What about this week?' },
  { role: 'assistant', content: JSON.stringify({
    reasoning: 'Follow-up with no new category named — reuse Entertainment from the previous question, only the date range changes. Negate the sum, as with any spending total.',
    sql: "SELECT SUM(-t.amount) FROM transactions t JOIN categories c ON t.category_id = c.id WHERE c.name = 'Entertainment' AND t.transaction_at >= date_trunc('week', CURRENT_DATE)",
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

// Call 2's worked examples — same idiom as FEW_SHOT_EXAMPLES above, for the
// same reason: the failure mode these fix ("empty results → generic
// 'no transactions' guess") is a pattern-match problem, and a described rule
// competes with the model's own training-data pattern for what an empty
// result usually means. A contrasting pair of worked examples outweighs it.
//
// The two cases below produce an identical `results: []` but have opposite
// correct explanations — the only thing that tells them apart is
// sqlReasoning, which is exactly the point: these examples exist to teach
// "go read sqlReasoning", not to teach two more canned sentences.
const FEW_SHOT_ANSWER_EXAMPLES = [
  // Inner join to a parent table (budgets/categories) came back empty — that
  // structurally means the parent row is missing, never that the child
  // (transactions) is. Saying "no transactions" here would be wrong, not
  // just vague — this user may well have transactions in that category.
  { role: 'user', content: JSON.stringify({
    question: 'Can I afford to eat out this week? Am I over budget?',
    sqlReasoning: "This user's active budget mode is category, so compare actual spend in Eating Out against its budgeted amount — join budgets to categories, then to transactions since the start of the period.",
    results: [],
    budgetMode: 'category',
    budgetPeriod: 'weekly',
  }) },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "sqlReasoning says this joined budgets to categories for Eating Out. That join only returns a row if a budgets row exists for that category, so an empty result means no budget is set for Eating Out — it says nothing about whether transactions exist in it. I should name that specific cause, not guess about transactions.",
    answer: "You haven't set a budget for Eating Out yet, so I can't tell you if this would put you over — want to set one?",
  }) },

  // Merchant search directly against transactions, no parent table involved
  // — here an empty result really does mean zero matching transactions,
  // because there's nothing else in the query that could produce the gap.
  { role: 'user', content: JSON.stringify({
    question: 'What did I spend on Netflix last month?',
    sqlReasoning: "Merchant name, not category — match merchant_name against 'netflix' with ILIKE, restricted to last calendar month.",
    results: [],
    budgetMode: 'overall',
    budgetPeriod: 'weekly',
  }) },
  { role: 'assistant', content: JSON.stringify({
    reasoning: "sqlReasoning shows this queried transactions directly by merchant name with no other table involved, so an empty result only has one explanation: no transaction matched 'netflix' last month.",
    answer: "You don't have any transactions matching Netflix last month.",
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

    // The model can't see application state — it can only see what's
    // queryable. Which budget table is "live" (overall vs category) is a
    // fact about this user, not something derivable from the SQL schema
    // alone, so it's resolved server-side (same authenticated client, same
    // pattern as the category list above) and stated directly in the
    // prompt rather than left for the model to infer from which table
    // happens to have rows.
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_budget_mode, category_budget_period')
      .eq('id', user.id)
      .single()
    const budgetMode = profile?.active_budget_mode ?? 'overall'
    const budgetPeriod = profile?.category_budget_period ?? 'weekly'

    console.log(`[${reqId}] active_budget_mode=${budgetMode} category_budget_period=${budgetPeriod}`)

    const schemaPrompt = `You write PostgreSQL SELECT queries for a UK
  budgeting app called SaveMyMoney.

  Only these tables exist for you to query:

  transactions (id, category_id, amount, currency, merchant_name,
  transaction_at)
    - amount is an integer in pence. Its SIGN carries real meaning, not just
  magnitude: money leaving the account (spending) is NEGATIVE, money arriving
  (income) is POSITIVE — e.g. a £5.50 coffee is stored as -550, a £5.50
  refund as 550. This is the real bank data as Monzo reports it, not a bug.
    - Because of this, ALWAYS negate a spending SUM — write SUM(-t.amount),
  never SUM(t.amount) — whenever you're totalling spending-kind transactions.
  This matters for two reasons: budgets.amount and overall_budgets.amount are
  always stored positive, so a negated spend total is what's directly
  comparable to a budgeted one; and ORDER BY on a raw (un-negated) sum sorts
  backwards for "biggest"/"most" — DESC on negative numbers ranks the
  smallest spender first, not the biggest. Only skip the negation for
  kind = 'income' totals, where the raw sum is already positive.
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
  budgets (id, category_id, amount)
    - amount in pence. One row per category the user has budgeted. There is
  no period column — every row shares one period, stated below as a fact,
  not something to read from the table.
  overall_budgets (id, amount, period)
    - amount in pence. At most one row for this user — a single overall
  spending limit, not split by category. period is 'weekly' or 'monthly'.

  This user's active budget mode is: ${budgetMode}.
${budgetMode === 'category'
    ? `  Their shared category-budget period is: ${budgetPeriod}. Every row in
  budgets uses this same period — do not look for a period column on it.
  Treat ANY question about budgets, affordability, or whether spending is
  okay as a budget question — not only ones that literally say "budget".
  "Can I afford this", "should I get takeaway", "is it fine to spend on X",
  "am I overspending" all count. For these, query budgets joined to
  categories (and to transactions for actual spend) for the category named
  or implied, not overall_budgets — overall_budgets may still hold a number
  left over from before the user switched modes, and it is not the number
  currently being tracked.`
    : `  Since mode is overall, budgets may still hold rows left over from
  before the user switched modes — ignore it for budget questions unless
  the question explicitly asks about a specific category's budget, in which
  case answer honestly using overall_budgets (the number actually being
  tracked) plus that category's real spend, rather than declining just
  because there's no per-category row for it.`
}
  - Resolve "this week"/"this month"/period-based budget questions using
  date_trunc('week', CURRENT_DATE) for 'weekly' and date_trunc('month',
  CURRENT_DATE) for 'monthly', matching whichever period applies above.

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
  the question needs — work this out before writing sql, not at the same time.
  - Never state in reasoning whether a row, budget, or piece of data exists or
  doesn't — that's not something you know yet. Reasoning describes what
  you're about to check; the query result is what answers it.`

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

You'll be given the user's original question, sqlReasoning (Call 1's own explanation of what its
query was trying to compute), the raw query results that answer it (as JSON), and — before that —
the recent conversation leading up to it.

Write a short, plain-English answer using ONLY the data in results — never invent or assume a number
that isn't in results or already stated earlier in the conversation. sqlReasoning is not a data
source and must never be used to produce a number — it exists only to explain why results look the
way they do.

EVERY numeric value in results is an integer in pence, never pounds — this applies no matter what
the field is called (amount, spent, budgeted, total, overall_budgeted, groceries_spend, or anything
else a query happened to name it). Always divide by 100 before writing it as a £ figure: 550 →
"£5.50", 15000 → "£150.00", 16621 → "£166.21". Never print a raw pence integer as if it were
already pounds — a number in the thousands in these results is almost always still pence, not a
suspiciously large pound amount.

Some questions aren't asking for new data at all — they're asking about the PREVIOUS answer's own
details (e.g. "in what time range?", "which category was that?", "what did you just say?"). For
those, answer directly from the conversation history rather than treating the current query results
as if they answer it — the results in front of you may be unrelated or empty for a question like this.

If results is empty or a value in it is null, and the question isn't one of those history questions,
say so honestly rather than guessing — but say WHY, by reading sqlReasoning first. sqlReasoning tells
you what the query was actually checking, which usually pins down a specific, correct cause: an inner
join from a parent table (e.g. budgets to categories) coming back empty means no budget row exists
for that category, not that transactions are missing; a plain sum or search directly against
transactions coming back empty means there really are no matching transactions. Name the specific
cause sqlReasoning supports. If sqlReasoning doesn't make the gap explicable, stay honestly vague
rather than inventing a specific-sounding cause it doesn't actually support.

You'll also be told the user's active budget mode ('overall' or 'category') and, in category mode,
their shared period. If a question asks about a specific category's budget while the mode is
'overall', the results won't contain a per-category budget for it — that's expected, not missing
data. Explain honestly that they track one overall number rather than per-category budgets, then
still answer usefully with whatever overall budget and category-spend figures are in the results,
e.g. "you don't have a Groceries-specific budget — you're tracking £165/week overall, and you've
spent £42 on Groceries this week." Don't apologise or treat this as an error.

Keep the final answer conversational and brief — one or two sentences, not a report.

In reasoning, briefly work out what the results (and, if they're empty or null, sqlReasoning) actually
support before writing the answer — same order Call 1 uses reasoning-then-sql, so the answer benefits
from that thinking rather than jumping straight to a guess.`

    const answerRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        // Structured Outputs here too, mirroring Call 1 — reasoning before
        // answer so the model's own reasoning tokens are in context by the
        // time it writes the answer, not just a field that happens to exist.
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'answer_response',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                reasoning: { type: 'string' },
                answer: { type: 'string' },
              },
              required: ['reasoning', 'answer'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0,
        messages: [
          { role: 'system', content: answerPrompt },
          ...FEW_SHOT_ANSWER_EXAMPLES,
          ...sanitisedHistory,
          { role: 'user', content: JSON.stringify({ question, sqlReasoning: reasoning, results: rows, budgetMode, budgetPeriod }) },
        ],
      }),
    })

    const answerData = await answerRes.json()

    // PROBE 4 — same shape as PROBE 2 for Call 1: finish_reason first (a
    // "length" cutoff would break the JSON.parse right below), then the raw
    // content so a malformed response is diagnosable from the log alone.
    console.log(`[${reqId}] call 2 finish_reason=${answerData.choices?.[0]?.finish_reason} | raw=${answerData.choices?.[0]?.message?.content}`)

    const { reasoning: answerReasoning, answer } = JSON.parse(answerData.choices[0].message.content)
    console.log(`[${reqId}] call 2 reasoning="${answerReasoning}"`)

    // PROBE 5 — the final plain-English answer actually sent back to the app.
    console.log(`[${reqId}] call 2 answer="${answer}"`)

    return new Response(JSON.stringify({ answer }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
)