import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')

// Service-role client, no user JWT — runs as admin across every user's data,
// bypassing RLS entirely.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  secretKeys['default'] ?? ''
)

const BATCH_SIZE = 25

// Worked examples, not just described rules — same idiom as ask-cait's
// FEW_SHOT_EXAMPLES, duplicated from categorise-transactions rather than
// shared, matching this file's existing "duplicated so this function stays
// independently deployable" philosophy (see validateCategorisations below).
//
// The category/transaction ids here (ex-cat-…, ex-tx-…) are deliberately
// fake and easy to spot as fake — real ids are Postgres UUIDs. Without an
// obvious tell, the model could echo one of these back in a real answer
// instead of picking a real category_id from the list it's actually given.
// The reminder at the end of systemPrompt says this explicitly too.
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

// Shapes for the untyped .rpc() results below — no generated Database type
// to infer from, so we assert these once here instead of `any`-ing everywhere.
type ClaimedTransaction = {
  id: string
  bank_connection_id: string
  merchant_name: string | null
  amount: number
  transaction_at: string
  categorisation_attempts: number
}

type Category = {
  id: string
  name: string
  kind: 'spending' | 'income' | 'transfer'
}

// cron posts an empty body, hence _req.
Deno.serve(async (_req) => {
  // Short id per invocation so interleaved cron logs can be filtered to one run.
  const runId = crypto.randomUUID().slice(0, 8)

  // Atomically claim a batch: locks unclaimed/stale rows (FOR UPDATE SKIP
  // LOCKED) and stamps claimed_at so a crashed worker's claim expires after
  // 5 minutes and becomes claimable again.
  const { data: claimedData, error: claimError } = await supabase
    .rpc('claim_uncategorised_transactions', { batch_size: BATCH_SIZE })

  const claimed = claimedData as ClaimedTransaction[] | null

  if (claimError) {
    console.error(`[${runId}] claim failed:`, claimError.message)
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 })
  }

  if (!claimed || claimed.length === 0) {
    console.log(`[${runId}] nothing to categorise`)
    return new Response(JSON.stringify({ categorised: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // PROBE 1 — input quality: merchant_name is the only field sent to the
  // model, so a blank one means "Uncategorised" is correct, not a bug.
  const blankMerchantNames = claimed.filter((t) => !t.merchant_name?.trim()).length
  const distinctMerchantNames = new Set(claimed.map((t) => t.merchant_name)).size
  const retries = claimed.filter((t) => t.categorisation_attempts > 0).length
  console.log(`[${runId}] claimed ${claimed.length} transactions | ${retries} retries (previously fell back) | ${blankMerchantNames} blank merchant_name | ${distinctMerchantNames} distinct merchant_name`)

  // transactions only has bank_connection_id, not user_id — look up owners
  // in one batched query instead of one per transaction.
  const bankConnectionIds = [...new Set(claimed.map((t) => t.bank_connection_id))]

  const { data: bankConnections, error: bcError } = await supabase
    .from('bank_connections')
    .select('id, user_id')
    .in('id', bankConnectionIds)

  if (bcError || !bankConnections) {
    return new Response(JSON.stringify({ error: bcError?.message ?? 'Could not load bank connections' }), { status: 500 })
  }

  const userIdByConnectionId = new Map(bankConnections.map((bc) => [bc.id, bc.user_id]))

  // One bucket per user — each has their own category list, so each gets
  // its own OpenAI call.
  const transactionsByUser = new Map<string, typeof claimed>()
  for (const t of claimed) {
    const userId = userIdByConnectionId.get(t.bank_connection_id)
    if (!userId) continue
    if (!transactionsByUser.has(userId)) transactionsByUser.set(userId, [])
    transactionsByUser.get(userId)!.push(t)
  }

  let totalCategorised = 0

  // One OpenAI call + upsert per user. A failure for one user is logged and
  // skipped rather than losing the whole batch's progress.
  for (const [userId, userTransactions] of transactionsByUser) {
    // This client is service-role, so RLS isn't filtering rows — do by hand
    // what RLS does automatically elsewhere: global categories (user_id is
    // null) plus this user's own.
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id,name,kind')
      .or(`user_id.is.null, user_id.eq.${userId}`)

    if (categoriesError || !categoriesData) {
      console.error(`[${runId}] could not load categories for user ${userId}:`, categoriesError?.message)
      continue
    }

    const categories = categoriesData as Category[]

    // PROBE 2 — is the model being offered a sensible menu?
    console.log(`[${runId}] user ${userId}: ${userTransactions.length} transactions | ${categories.length} categories: ${categories.map((c) => c.name).join(', ')}`)

    const fallbackCategory = categories.find((c) => c.name === 'Uncategorised')
    if (!fallbackCategory) {
      console.error(`[${runId}] no Uncategorised category found for user ${userId}`)
      continue
    }

    // Reverses the old prompt's "if nothing fits well, use Uncategorised",
    // which the model took as an invitation to bail 80% of the time.
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
      transactions: userTransactions.map((t) => ({ id: t.id, merchant_name: t.merchant_name, amount: t.amount })),
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
        // temperature 0 = near-deterministic. Default (1.0) is why the same
        // merchant string got three different labels across runs.
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          ...FEW_SHOT_EXAMPLES,
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    // PROBE 3 — did the call itself succeed? A 401/429 used to fall through
    // silently (no .choices → rawResults [] → looked like a clean run).
    if (!openaiRes.ok) {
      console.error(`[${runId}] openai HTTP ${openaiRes.status} for user ${userId}:`, await openaiRes.text())
      continue
    }

    const openaiData = await openaiRes.json()

    // finish_reason "length" = ran out of output tokens mid-JSON, which
    // breaks the parse below — classic failure when asking for 100 results at once.
    const finishReason = openaiData.choices?.[0]?.finish_reason
    console.log(`[${runId}] openai ok | finish_reason=${finishReason} | completion_tokens=${openaiData.usage?.completion_tokens}`)

    const content = openaiData.choices?.[0]?.message?.content ?? '{}'

    let rawResults: { id: string; category_id: string }[] = []
    try {
      rawResults = JSON.parse(content).results ?? []
    } catch (err) {
      // PROBE 4 — log the tail, not just "parse failed": if truncated, the
      // end is where you see it cut off mid-object.
      console.error(`[${runId}] JSON parse failed for user ${userId}:`, (err as Error).message)
      console.error(`[${runId}] content tail:`, content.slice(-300))
      rawResults = []
    }

    const validTransactionIds = new Set(userTransactions.map((t) => t.id))
    const validCategoryIds = new Set(categories.map((c: { id: string; name: string }) => c.id))

    const {
      validated: safeResults,
      modelFallback,
      validationFallback,
      distinctBadCategoryIds,
      droppedUnknownIds,
    } = validateCategorisations(
      rawResults,
      validTransactionIds,
      validCategoryIds,
      fallbackCategory.id
    )

    // Fallback position in the model's own output order: heavy second-half
    // fallbacks means the model coasted through the tail (smaller batch fixes it).
    const midpoint = Math.floor(rawResults.length / 2)
    const isFallback = (r: { category_id: string }) => r.category_id === fallbackCategory.id
    const fallbackFirstHalf = rawResults.slice(0, midpoint).filter(isFallback).length
    const fallbackSecondHalf = rawResults.slice(midpoint).filter(isFallback).length

    // PROBE 5 — the discriminator. sent-vs-returned = model skipped rows
    // (smaller batch); model-fallback = model gave up (more signal needed);
    // validation-forced = model hallucinated an id (stricter prompt). In the
    // DB these last two both just write Uncategorised, which is why raw
    // counts of it told us nothing about the cause.
    console.log(
      `[${runId}] user ${userId} summary: sent=${userTransactions.length} returned=${rawResults.length} written=${safeResults.length} | model-fallback=${modelFallback} validation-forced=${validationFallback} | fallback position: ${fallbackFirstHalf} first-half / ${fallbackSecondHalf} second-half`
    )

    if (droppedUnknownIds > 0 || distinctBadCategoryIds.length > 0) {
      console.warn(
        `[${runId}] user ${userId} rejects: ${droppedUnknownIds} unknown transaction id(s) dropped | ${distinctBadCategoryIds.length} distinct bad category_id(s), e.g. ${distinctBadCategoryIds.slice(0, 3).join(', ')}`
      )
    }

    const transactionsById = new Map(userTransactions.map((t) => [t.id, t]))

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
      console.error(`[${runId}] upsert failed for user ${userId}:`, updateError.message)
      continue
    }

    totalCategorised += safeResults.length
  }

  // If claimed vs categorised differ, transactions were claimed but never
  // written, and will be re-claimed in 5 minutes.
  console.log(`[${runId}] done: categorised ${totalCategorised}/${claimed.length}`)

  return new Response(JSON.stringify({ categorised: totalCategorised, claimed: claimed.length, runId }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

/**
 * Same safety gate as categorise-transactions, duplicated so this function
 * stays independently deployable. The LLM's response is untrusted input: it
 * could hallucinate a category_id or return a row for a transaction that
 * wasn't in this batch.
 *
 * Deliberately doesn't log — it has no runId/userId context, so the caller
 * logs what's worth printing instead.
 */
function validateCategorisations(
  results: { id: string; category_id: string }[],
  validTransactionIds: Set<string>,
  validCategoryIds: Set<string>,
  fallbackCategoryId: string
): {
  validated: { id: string; category_id: string }[]
  modelFallback: number
  validationFallback: number
  distinctBadCategoryIds: string[]
  droppedUnknownIds: number
} {
  const withValidTransactionIds = results.filter((r) => validTransactionIds.has(r.id))

  // Counted on withValidTransactionIds so modelFallback/validationFallback
  // reconcile against validated.length, not the raw (possibly invented) results.
  const modelFallback = withValidTransactionIds.filter((t) => t.category_id === fallbackCategoryId).length

  const rejectedCategoryIds: string[] = []
  let validationFallback = 0

  const validated = withValidTransactionIds.map((r) => {
    if (!validCategoryIds.has(r.category_id)) {
      rejectedCategoryIds.push(r.category_id)
      validationFallback++
      return { id: r.id, category_id: fallbackCategoryId }
    }
    return { id: r.id, category_id: r.category_id }
  })

  const droppedUnknownIds = results.length - withValidTransactionIds.length

  return {
    validated,
    modelFallback,
    validationFallback,
    distinctBadCategoryIds: [...new Set(rejectedCategoryIds)],
    droppedUnknownIds,
  }
}
