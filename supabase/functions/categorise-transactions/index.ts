import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BATCH_SIZE = 50

// Worked examples, not just described rules — same idiom as ask-cait's
// FEW_SHOT_EXAMPLES. The bullet list below already *describes* these rules;
// showing the model an actual input/output pair for each is what makes it
// reliably apply them, especially the sign-based ones (a betting merchant
// is Entertainment when negative but Income when positive) that are easy to
// get half-right from prose alone.
//
// The category/transaction ids here (ex-cat-…, ex-tx-…) are deliberately
// fake and easy to spot as fake — real ids are Postgres UUIDs. That's not
// cosmetic: without an obvious tell, the model could latch onto one of
// these ids and echo it back in a real answer instead of picking a real
// category_id from the actual list it's given. The reminder at the end of
// systemPrompt says this explicitly too — belt and braces.
const FEW_SHOT_EXAMPLES = [
  { role: 'user', content: JSON.stringify({
    categories: [
      { id: 'ex-cat-groceries', name: 'Groceries', kind: 'spending' },
      { id: 'ex-cat-eating-out', name: 'Eating Out', kind: 'spending' },
      { id: 'ex-cat-bills', name: 'Bills & Subscriptions', kind: 'spending' },
      { id: 'ex-cat-cash', name: 'Cash', kind: 'transfer' },
      { id: 'ex-cat-uncategorised', name: 'Uncategorised', kind: 'spending' },
    ],
    transactions: [
      { id: 'ex-tx-1', merchant_name: "MCDONALD'S BRIGHTON", amount: -650 },
      { id: 'ex-tx-2', merchant_name: 'TESCO STORES 2909', amount: -3412 },
      { id: 'ex-tx-3', merchant_name: 'NETFLIX.COM', amount: -1099 },
      { id: 'ex-tx-4', merchant_name: 'LNK*ATM WITHDRAWAL', amount: -2000 },
      { id: 'ex-tx-5', merchant_name: 'REF 837462910', amount: -150 },
    ],
  }) },
  { role: 'assistant', content: JSON.stringify({ results: [
    { id: 'ex-tx-1', category_id: 'ex-cat-eating-out' },   // fast food merchant → Eating Out, not Groceries or Uncategorised
    { id: 'ex-tx-2', category_id: 'ex-cat-groceries' },
    { id: 'ex-tx-3', category_id: 'ex-cat-bills' },        // recurring subscription → Bills & Subscriptions, not Entertainment
    { id: 'ex-tx-4', category_id: 'ex-cat-cash' },
    { id: 'ex-tx-5', category_id: 'ex-cat-uncategorised' }, // a bare reference number genuinely tells you nothing — correct to decline here
  ] }) },

  { role: 'user', content: JSON.stringify({
    categories: [
      { id: 'ex-cat-transfers', name: 'Transfers', kind: 'transfer' },
      { id: 'ex-cat-income', name: 'Income', kind: 'income' },
      { id: 'ex-cat-entertainment', name: 'Entertainment', kind: 'spending' },
      { id: 'ex-cat-fees', name: 'Fees & Charges', kind: 'spending' },
    ],
    transactions: [
      { id: 'ex-tx-6', merchant_name: 'JOHN SMITH', amount: -2500 },
      { id: 'ex-tx-7', merchant_name: 'ACME LTD PAYROLL', amount: 145000 },
      { id: 'ex-tx-8', merchant_name: 'BET365', amount: -2000 },
      { id: 'ex-tx-9', merchant_name: 'BET365', amount: 5000 },
      { id: 'ex-tx-10', merchant_name: 'COINBASE', amount: -10000 },
      { id: 'ex-tx-11', merchant_name: 'DD RETURNED - BRITISH GAS', amount: 4500 },
    ],
  }) },
  { role: 'assistant', content: JSON.stringify({ results: [
    { id: 'ex-tx-6', category_id: 'ex-cat-transfers' },     // a person's name → Transfers
    { id: 'ex-tx-7', category_id: 'ex-cat-income' },        // wages → Income
    { id: 'ex-tx-8', category_id: 'ex-cat-entertainment' }, // betting spend (negative) → Entertainment
    { id: 'ex-tx-9', category_id: 'ex-cat-income' },        // same merchant, positive (a win) → Income, not Entertainment
    { id: 'ex-tx-10', category_id: 'ex-cat-transfers' },    // crypto platform → Transfers, money isn't spent, it's moved into an asset
    { id: 'ex-tx-11', category_id: 'ex-cat-income' },       // returned direct debit is money coming BACK → Income, not Fees & Charges
  ] }) },
]

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')

  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    secretKeys['default'] ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  )

  const jwt = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(jwt)

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401 })
  }

  // This user's valid categories — global defaults + anything they created.
  // RLS (categories SELECT policy) is doing the "user_id is null or mine" filtering for us.
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, kind')

  if (categoriesError || !categories) {
    return new Response(JSON.stringify({ error: 'Could not load categories' }), { status: 500 })
  }

  const fallbackCategory = categories.find((c) => c.name === 'Uncategorised')
  if (!fallbackCategory) {
    return new Response(JSON.stringify({ error: 'No Uncategorised category found' }), { status: 500 })
  }

  // A batch of this user's not-yet-categorised transactions.
  // RLS (transactions SELECT policy) is doing the "belongs to me" filtering for us.
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, merchant_name, bank_connection_id, amount, transaction_at, categorisation_attempts')
    .is('category_id', null)
    .limit(BATCH_SIZE)

  if (txError) {
    return new Response(JSON.stringify({ error: txError.message }), { status: 500 })
  }

  if (!transactions || transactions.length === 0) {
    return new Response(JSON.stringify({ categorised: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const systemPrompt = `You are a transaction categorisation assistant for a UK budgeting app.

Assign every transaction the single best-fitting category_id from the provided list.

Commit to the closest match even when the fit is imperfect — a roughly-right category is far
more useful to a student than no category at all. Only use "${fallbackCategory.id}" (Uncategorised)
when a description genuinely tells you nothing about what the money was for, such as a bare
reference number or a meaningless code.

Each category has a "kind":
  spending — money leaving the account for goods or services
  income   — money arriving in the account
  transfer — money moving without being spent (savings, sending money to a person, cash out)

Do not trust the merchant name alone to tell you which of these applies — check "amount" on every
transaction. amount is the signed value in pence: negative means money left the account, positive
means money arrived. This is ground truth about direction, and it overrides any guess you'd
otherwise make from the text. A category with kind "spending" must never be assigned to a positive
amount — if the merchant name doesn't clearly explain a positive amount as wages, a refund, cashback
or a transfer, that is still not a reason to fall back to a spending category. Prefer Income in that
case; only prefer Transfer if something in the description points more specifically at a transfer.

Guidance for common UK bank descriptions:
- A person's name usually means money sent to or received from someone → a transfer.
- ATM or cash machine withdrawals → Cash.
- Wages, student loans, benefits, tax credits, refunds and cashback → Income.
- Round-up or savings transfers (e.g. "SAVE THE CHANGE", Monzo's round-up feature) → Transfers.
- Bank charges and overdraft fees → Fees & Charges — this is money actually leaving the account
  as a cost.
- A returned or bounced direct debit → Income, not Fees & Charges. Same reasoning as a refund: the
  payment reversed, so the money is arriving back, not leaving.
- A recurring media or software service → Bills & Subscriptions, not Entertainment.
- A crypto or trading platform (Circle, Coinbase, eToro, or anything with "trading" in the name)
  → Transfers — the money isn't spent, it's moved into an asset the student still holds.
- A betting, casino or gaming operator (Bet365, Betfred, Betropolis, anything with "bet" or
  "gaming" in the name) → Entertainment, but only for money going to them — that's the actual
  spend. A win or cashout coming back from one → Income, not Entertainment, for the same reason
  as the direct debit case above: money arriving from outside, not still held anywhere.
- A wholesaler or cash-and-carry (Booker, Costco) → Groceries.

Only ever use a category_id from the provided list — never invent one.
Respond with ONLY JSON in this exact shape: {"results": [{"id": "<transaction-id>", "category_id": "<category-id>"}]}

The worked examples you'll see use ids like "ex-cat-…" and "ex-tx-…" purely to demonstrate the task —
never write one of those ids into your actual answer. Always take id and category_id values from the
real categories and transactions given to you in this request.`

  const userPrompt = JSON.stringify({
    categories: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
    transactions: transactions.map((t) => ({ id: t.id, merchant_name: t.merchant_name, amount:t.amount })),
  })

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      // temperature 0 = near-deterministic. Matches categorise-backlog — default
      // (1.0) is why the same merchant string could get different labels across runs.
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        ...FEW_SHOT_EXAMPLES,
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  const openaiData = await openaiRes.json()
  // Not the full response - it echoes back real merchant names/amounts from
  // the prompt, which don't need to sit in function logs verbatim. Same
  // idiom as categorise-backlog's equivalent log line.
  console.log('openai response ok:', openaiRes.ok, '| finish_reason:', openaiData.choices?.[0]?.finish_reason, '| completion_tokens:', openaiData.usage?.completion_tokens)

  let rawResults: { id: string; category_id: string }[] = []
  try {
    rawResults = JSON.parse(openaiData.choices?.[0]?.message?.content ?? '{}').results ?? []
  } catch {
    rawResults = []
  }

  const validTransactionIds = new Set(transactions.map((t) => t.id))
  const validCategoryIds = new Set(categories.map((c) => c.id))

  const safeResults = validateCategorisations(
    rawResults,
    validTransactionIds,
    validCategoryIds,
    fallbackCategory.id
  )

  console.log(safeResults)

  const transactionsById = new Map(transactions.map((t) => [t.id, t]))

  const { error: updateError } = await supabase
    .from('transactions')
    .upsert(
      safeResults.map((r) => {
        const original = transactionsById.get(r.id)!
        return {
          id: r.id,
          category_id: r.category_id,
          bank_connection_id: original.bank_connection_id,
          amount: original.amount,
          transaction_at: original.transaction_at,
          categorisation_attempts: original.categorisation_attempts + 1,
        }
      }),
      { onConflict: 'id' }
    )

  if (updateError) {
    console.error('upsert failed:', updateError.message)
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ categorised: safeResults.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

/**
 * The safety gate. The LLM's response is untrusted input — it could hallucinate a
 * category_id that doesn't exist in this user's category list, return a row for a
 * transaction_id that wasn't even in the batch we sent, or return duplicate/malformed
 * entries. This function decides what's safe to actually write to the database.
 *
 * TODO: for each result in `results`:
 *   - if `id` isn't in `validTransactionIds`, or `category_id` isn't in `validCategoryIds`
 *     — decide what to do (drop it? fall back to `fallbackCategoryId`?)
 *   - return only the rows that are safe to upsert
 */
function validateCategorisations(
  results: { id: string; category_id: string }[],
  validTransactionIds: Set<string>,
  validCategoryIds: Set<string>,
  fallbackCategoryId: string
): { id: string; category_id: string }[] {
  // your logic here
  const withValidTransactionIds = results.filter((r) => validTransactionIds.has(r.id) )
  const withValidCategoriesIds = withValidTransactionIds.map((c) => {
    if (!validCategoryIds.has(c.category_id)){
      console.warn(`Invalid category_id ${c.category_id} for transaction ${c.id}, falling back`)
     return {id: c.id, category_id: fallbackCategoryId}
    }
    else{
      return {id: c.id, category_id:c.category_id}
    }
  })
  return withValidCategoriesIds
}
