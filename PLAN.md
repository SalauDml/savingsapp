# CAIT (SaveMyMoney) — Build & Learning Plan

This file tracks what we've built, what we're building next, and what's coming.
Update this file at the end of every session or when a phase completes.

---

## Progress Key
- ✅ Done
- 🔄 In Progress
- ⬜ Not Started

---

## Phase 1 — Foundation ✅ Complete
Goal: Get the project skeleton in place with auth working end-to-end.

- ✅ Monorepo structure (`apps/mobile`, `supabase/`, `packages/`)
- ✅ Expo project initialised with EAS configured for Android
- ✅ Supabase project created, keys secured in `.env`
- ✅ Supabase client set up in `apps/mobile/lib/supabase.ts`
- ✅ Database schema designed and migrated (categories, profiles, bank_connections, transactions, budgets)
- ✅ Row Level Security policies written for all tables
- ✅ Sign-up screen (`app/(auth)/sign-up.tsx`)
- ✅ Sign-in screen (`app/(auth)/sign-in.tsx`)
- ✅ Root layout + auth guard (`app/_layout.tsx`)
- ✅ Profile creation on sign-up (insert into `profiles` after auth)

**Concepts covered:** monorepo, Expo, EAS, Supabase, SQL schema design, foreign keys, RLS, React Native primitives, useState, async/await

---

## Phase 2 — App Shell ✅ Complete
Goal: A navigable app with real screens the user can move between.

- ✅ Root layout with auth guard
- ✅ Tab navigator (Home, Transactions, Ask CAIT, Settings)
- ✅ Home screen skeleton
- ✅ Transactions screen skeleton
- ✅ Settings screen (with sign out)
- ✅ Auth screens redesigned to CAIT brand identity

**Concepts covered:** Expo Router layouts, tab navigation, stack navigation

---

## Phase 3 — Bank Connection (Monzo) 🔄 In Progress — pivoted from TrueLayer
Goal: User can connect their bank and real transactions flow into the app.

**Why the pivot (see Decisions Made below for full reasoning):** this app is being built for personal, single-user use — not to ship to other people. TrueLayer's production access is sales-gated (KYB, FCA agent registration, weeks of lead time) with no lighter path for a non-commercial single user; the same is true of Yapily, Salt Edge, and Plaid. Enable Banking looked like a self-serve fit but its own docs don't list UK bank coverage. Monzo (and Starling) run first-party developer APIs explicitly designed for "connect only your own account" — self-serve, no company registration, no KYB.

### What carries over unchanged
- `bank_connections` schema (`bank_name`, `access_token`, `refresh_token`, `token_expires_at`) — already provider-agnostic, no migration needed
- The overall OAuth2 code-exchange shape in `exchange-token` — Monzo's token endpoint takes the same `grant_type`/`client_id`/`client_secret`/`code`/`redirect_uri` params TrueLayer's did
- `cait://auth/callback` deep link and `auth/callback.tsx` receiver
- Token refresh pattern in `fetch-transactions` (check `token_expires_at`, refresh if stale) — Monzo confidential clients get real refresh tokens the same way

### What actually needs to change
- ⬜ Register SaveMyMoney as an OAuth client in Monzo's Developer Tools (confidential client — we already exchange the code server-side, never in the app) — **your action next**
- ⬜ `connect-bank.tsx`: replace the TrueLayer sandbox URL with `https://auth.monzo.com/?client_id=...&redirect_uri=cait://auth/callback&response_type=code&state=...`; multi-bank picker grid no longer makes sense functionally (Monzo has no "choose your bank" step) — decide whether to simplify the screen or leave the grid as a visual placeholder for a future multi-provider version
- ⬜ `exchange-token`: point at `https://api.monzo.com/oauth2/token`, swap `TRUELAYER_CLIENT_ID`/`SECRET` env vars for Monzo equivalents
- ⬜ `fetch-transactions`: swap `https://api.truelayer-sandbox.com/data/v1/accounts` → `https://api.monzo.com/accounts`, and the per-account transactions call → `https://api.monzo.com/transactions?account_id=...`; response shape differs (Monzo's transaction amount is already an integer in minor units — pence — so the `Math.round(tx.amount * 100)` conversion TrueLayer needed must be removed, not just reused)
- ⬜ Rename `truelayer_transaction_id` → a provider-neutral column (e.g. `provider_transaction_id`) via migration, since it's no longer TrueLayer-specific — small schema cleanup, not required to function but avoids a permanently misleading column name
- ⬜ Handle Monzo's 5-minute full-history window: the first sync after connecting must pull full transaction history immediately, since after 5 minutes the API restricts to the last 90 days only
- ⬜ Retire `webhook-truelayer` (was never registered anyway) — Monzo supports real push webhooks (`POST /webhooks` with `account_id`+`url`, fires `transaction.created`), which is a genuine upgrade over TrueLayer's async-job-only model. Not required for the pivot to work — real-time push can be a Phase 7+ enhancement once polling-on-refresh is working end-to-end again.

**Concepts to cover:** Monzo's confidential-client OAuth flow, the 5-minute/90-day transaction access window, real push webhooks vs TrueLayer's async job model
**Concepts covered this phase (TrueLayer build, still valid — OAuth2 fundamentals don't change with the provider):** webhook vs WebSocket vs polling, HMAC signature verification, service role key vs user JWT and RLS implications, OAuth 2.0 code exchange, token expiry and refresh, upsert vs insert

---

## Phase 4 — Displaying Real Transactions ✅ Complete
Goal: Users can see their real transactions in the app.

- ✅ Call `fetch-transactions` from Home screen on mount (after confirming `bank_connections` row exists)
- ✅ Build `transactions.tsx`: SectionList of real rows from Supabase, grouped by date
- ✅ Each row: `merchant_name`, `amount` (pence ÷ 100, formatted as £X.XX), `transaction_at`
- ✅ Pull-to-refresh
- ✅ Add Supabase real-time subscription: `transactions-changes` channel listens for `postgres_changes` INSERT events on `transactions`, refetches on new rows, unsubscribes on unmount
- ✅ **Diagnosed and fixed a 5x transaction duplication bug** — every category's total was inflated exactly 5x, discovered from an Ask CAIT answer where "Bills & Subscriptions" summed positive. Traced via direct SQL (`supabase db query --linked`) against the hosted DB rather than guessing: `fetch-transactions`'s `for (const account of accounts)` loop was writing every account's transactions into the same `bank_connection_id`, with no column recording which account a row came from — and the TrueLayer sandbox connection has 5 separate demo accounts that all carry identical fixture data. The existing `(bank_connection_id, truelayer_transaction_id)` unique constraint couldn't catch this: TrueLayer ids are scoped per-account, so 5 accounts returning look-alike data each get their own legitimately-unique id. Fixed by adding an `account_id` column (migration `20260902000000`), widening the unique constraint to include it, and — since this app deliberately tracks one account, not a net-worth view — pinning `fetch-transactions` to `accounts[0]` instead of looping. Verified via `pg_constraint`/`pg_indexes` and by reading TrueLayer's `/accounts` response directly against the connection's stored token, not by guessing at the mechanism.

**Concepts covered:** Supabase queries, SectionList, real-time subscriptions via WebSocket (`postgres_changes` channel), integer-to-display money formatting, composite unique constraints and `ON CONFLICT` semantics (a match requires all columns together, not any one individually; `NULL` is never equal to `NULL` for uniqueness purposes), why summing multiple real bank accounts naively double-counts money moved between your own accounts

---

## Phase 5 — AI Categorisation 🔄 In Progress
Goal: Transactions are automatically categorised by an LLM.

- ✅ Write `categorise-transactions` Edge Function: takes a batch of uncategorised rows, sends merchant names to GPT-4o-mini with a system prompt listing category IDs, asks for JSON only: `{results: [{id, category_id}]}`. Includes a `validateCategorisations` safety gate (drop unknown transaction ids, fall back unknown category ids to "Uncategorised" with a warn) since the LLM's response is untrusted input.
- ✅ Use GPT-4o-mini (not GPT-4o) — ~$0.02 per 1,000 transactions
- ✅ Run `categorise-transactions` after `fetch-transactions` completes — chained client-side in `index.tsx` (`.then()` after the fetch call resolves), keeping each Edge Function single-purpose
- ✅ Distinguish "not categorised yet" from "Uncategorised" in the UI — `transactions.tsx` now shows italic/faded **"not categorised yet"** when `category_id` is genuinely `null` (pending), vs plain **"Uncategorised"** when `category_id` points at the real Uncategorised category (the model's actual, final answer). Previously both rendered as the identical string with no way to tell them apart.
- ✅ `BATCH_SIZE = 50` limit on `categorise-transactions` (per app-open) solved via `categorise-backlog` — a `claim_uncategorised_transactions` RPC + admin Edge Function that sweeps a batch across all users, now scheduled and confirmed running (see below)
- ✅ Deploy `categorise-backlog` (was written but never actually pushed to the hosted project — existing in `supabase/functions/` isn't the same as being live)
- ✅ Schedule `categorise-backlog` via `pg_cron` + `pg_net`: migration `20260715000000_schedule_categorise_backlog.sql`, runs every 5 minutes, calls the function with the publishable key in the `Authorization` header. Verified live: `cron.job_run_details` shows successful runs, `net._http_response` confirmed a 200 with rows actually updating in `transactions`.
- ✅ **Diagnosed and fixed the real fallback-rate bug** — traced via direct SQL against `transactions`/`categories` plus Edge Function logs (PROBE-style logging already built into `categorise-backlog`), not guesswork:
  - `categorise-transactions` (the client-triggered, per-sync path) was still running the *old* weak prompt at default temperature (1.0) — never got the `temperature: 0` + rewritten-prompt fix that `categorise-backlog` already had from an earlier session. Same merchant string (`SAVE THE CHANGE`) was getting different categories across duplicate rows in one batch — the signature of non-determinism, not a validation bug. Brought both functions to parity (same prompt, same `temperature: 0`, `kind` field included).
  - `categorise-backlog`'s `BATCH_SIZE` dropped 100 → 25 — logs showed `sent=100 returned=93` (7 transactions silently skipped) and fallbacks skewed toward the back half of the model's own output (`fallback position: 5 first-half / 8 second-half`) — a "coasting through a long batch" pattern smaller batches avoid.
  - Added explicit merchant-pattern examples to both prompts for cases the model was missing despite existing general rules: round-ups (`SAVE THE CHANGE`, Monzo's actual feature name), crypto/trading platforms → Transfers, betting/gaming operators → Entertainment, wholesalers (`Booker`) → Groceries.
  - Net result verified via SQL: fallback count went from **543/661 (≈82%) → ~21** total rows on the first full reprocess.
- ✅ **The "one-way door" structural bug** — `category_id is null` was the *only* signal either pipeline used for "needs categorising." Once any row fell back to the real (non-null) Uncategorised category — even from the old broken prompt — it became permanently invisible to reprocessing, no matter how good the prompt got later. Fixed via a `categorisation_attempts` column (migration `20260819000000`): `claim_uncategorised_transactions` now also retries rows sitting on Uncategorised, capped at **2 attempts total**, so genuinely-ambiguous merchants (the model reaches the same correct "can't tell" answer every time) don't get re-sent to OpenAI forever for zero benefit.
- ✅ Idle-aware cron — `categorise-backlog-every-5-min` now skips the `net.http_post` call entirely when there's no claimable backlog (migration `20260818000000`), instead of firing every 5 minutes forever regardless of whether there's work. Its "is there work" condition was re-synced (migration `20260819000001`) after the retry change above widened what counts as claimable — otherwise the guard would've silently stopped firing once no `null` rows remained, even with retry-eligible Uncategorised rows still waiting.
- ✅ Manual recategorisation UI — tap any row in `transactions.tsx` to open a category picker sheet (all global + own categories, current one checked). Selecting one writes `category_id` directly via Supabase (RLS already permits it — no Edge Function needed) and jumps `categorisation_attempts` to the cap so the automatic retry sweep can never silently overwrite a human's explicit choice.
- ⬜ Replace mock `CategoryRow` data on Home screen with real grouped totals: `SELECT category_id, SUM(amount_pence) FROM transactions WHERE user_id = $1 AND date >= date_trunc('month', now()) GROUP BY category_id`

**Deferred to Phase 7:**
- `net.http_post` timeout risk — default timeout (5000ms) is too tight for batches with several distinct users, since the function makes one sequential OpenAI call per user before responding. Confirmed happening once already (`net._http_response` row with `timed_out: true` after ~5s, DNS/handshake only ~56ms). The Edge Function's own work likely still completes even when this happens — the timeout only means `pg_net` stops waiting for the response, not that the function is killed — but it means bigger runs are currently unverifiable via `pg_net`. Fix: raise `timeout_milliseconds` on the `net.http_post` call in a new migration (suggested: 30000ms).
- No real auth on `categorise-backlog` — the function currently accepts any caller with a valid-shaped Supabase key in the `Authorization` header, including the publishable key — which is public by design (shipped in the mobile app bundle). `verify_jwt: true` doesn't meaningfully restrict this since the gateway accepts the publishable key as valid. Fix: add a shared-secret check inside the function itself (e.g. compare a custom `x-cron-secret` header against an Edge Function secret only the cron job knows), independent of the `verify_jwt` toggle.
- Prompt duplication — `categorise-transactions` and `categorise-backlog` now carry near-identical system prompts in two separate files. If the prompt needs tuning again it has to change in both places, and it already drifted apart once. Fix: extract to a shared module (e.g. `supabase/functions/_shared/categorise-prompt.ts`) both functions import.
- The `2`-attempt retry cap is a magic number duplicated in two places (the `claim_uncategorised_transactions` default parameter and the cron guard's SQL) — changing it means updating both in sync. Fix: a single source of truth (e.g. a settings table or a Postgres constant function) if this needs to change again.
- `RENT` / housing-association transactions have no dedicated category (only `Bills & Subscriptions` and `Fees & Charges` exist as general spending buckets) — a small, accepted gap for now, not a vague catch-all category. Revisit if it turns out to matter more once real user data grows.
- ⬜ Connect `CategoryRow` component to real data — pass emoji, name, total spend (÷100), budget amount
- ✅ **Diagnosed and fixed a sign-blindness bug in `categorise-transactions`** — spending categories were coming back net *positive* in Ask CAIT answers. Root cause was narrower than it first looked: the function's DB query already selected `amount`, but the `userPrompt` sent to the LLM only ever included `id` and `merchant_name` — the model was assigning categories with no way to know whether a transaction was money leaving or arriving. Fixed by adding `amount` to the prompt and an explicit rule: a category with `kind = 'spending'` must never be assigned to a positive amount, and the merchant name alone is not sufficient grounds to guess direction.
- ✅ **Found and fixed two content rules that directly contradicted the sign rule above** — "returned direct debits → Fees & Charges" and "betting/gaming operator → Entertainment" were both written without regard to direction, so a bounced payment or a win/cashout (both positive) collided head-on with the new "spending must never be positive" rule. Resolved using the same test the rest of the categorisation guidance already uses for refunds/cashback (line ~72): money arriving from *outside* — a company reversing a payment, a betting site paying out — is Income, not Fees & Charges/Entertainment; that's different from Transfer, which is reserved for money you still hold in some form (your own accounts, a person, a trading-platform asset).
- ✅ Confirmed the `categorise-backlog` claim queue (`claim_uncategorised_transactions`) is a single FIFO ordered by `created_at`, not two separately-prioritised pools — after a full resync landed ~300 rows in one burst, some already-`Uncategorised` rows sat unprocessed for 30-40+ minutes purely because ~180 older-by-milliseconds `NULL` rows kept winning the same `order by created_at limit batch_size` race every cycle. Not a bug, just a one-time consequence of resyncing an entire history at once rather than the normal trickle of a few new transactions a day.

**Concepts to cover:** LLM APIs, structured output/JSON mode, prompt design, cost control, batching, Edge Functions as middleware
**Concepts covered this phase:** OpenAI API key setup and billing, validating untrusted LLM output before writing to the DB, Supabase embedded resources (PostgREST foreign-key joins), Postgres upsert semantics (`INSERT ... ON CONFLICT DO UPDATE` requires NOT NULL columns even when only updating), RLS policy debugging (a migration written but never pushed silently blocked all writes — `supabase migration list` to compare local vs remote), `pg_cron` + `pg_net` scheduling, dollar-quoting (`$$...$$`) for nested SQL strings, `pg_net`'s async fire-and-forget model and its separate `net._http_response` log, why a public/publishable key doesn't make `verify_jwt` a meaningful access control
**Concepts covered this session (categorisation debugging):** LLM `temperature` and why default (1.0) sampling makes identical inputs produce different outputs across calls; large single-shot batches degrading LLM output quality/completeness ("lost in the middle" — smaller models like gpt-4o-mini coast through the back half of a long list); the difference between "the safety net caught a hallucinated id" vs "the model itself chose the fallback" (and why raw Uncategorised counts alone can't tell you which); a "one-way door" bug where a filter meant for "needs work" (`category_id is null`) silently also meant "never revisit this again" once any value — including a fallback placeholder — got written; retry-with-attempt-cap as the fix for "keep trying" vs "stop burning API calls on a hopeless case forever"; `pg_cron`'s schedule firing independently of whether the previous invocation's actual work has finished, and why that's safe here specifically because of `pg_net`'s fire-and-forget model plus the claim-then-expire locking pattern; keeping a cron guard's "is there work" condition in sync with whatever the claim function actually considers claimable, or the guard silently goes stale; React Native `Pressable`'s function-as-style prop for pressed-state styling, and the nested-`Pressable` trick for a tap-outside-to-close modal sheet

---

## Phase 6 — Ask CAIT (NLQ Chatbot) 🔄 In Progress
Goal: Users can ask questions about their transactions in plain English and get real answers.

- ✅ Write `ask-cait` Edge Function — built, and the actual security design ended up different (stricter) than originally planned below:
  - Receives a question + recent chat history from the user
  - Call 1: sends question + schema (including live category names/kinds) + few-shot examples to GPT-4o-mini. Returns `{reasoning, sql}` as JSON, or `sql: null` when the question needs history, not a query, or can't be answered reliably (e.g. forecasting).
  - Safety gate: query must start with `SELECT` (checked both client-side and again inside the DB function).
  - ~~Execute query against Supabase using service role key (bypasses RLS — safe because user_id is appended)~~ → **Not what was built, and safer:** a dedicated `cait_reader` Postgres role with narrow column-level `GRANT`s (no access to `bank_connections.access_token`/`refresh_token` even indirectly) runs the query inside a `SECURITY DEFINER` function (`execute_cait_query`, migration `20260820000001`), called via the *user's own JWT* — RLS still applies per-user, nothing manually appends `user_id`. Removes an entire class of bug (forgetting the `user_id` filter) rather than just gating it.
  - Call 2: send question + raw results back to LLM. Ask it to write a plain-English answer using only the provided data.
- ✅ Build `ask-cait.tsx` — chat UI, message bubbles, loading state, CAIT badge, suggestion chips all built and in use.
- ⬜ Edge cases (not yet verified this session):
  - No transactions yet → prompt user to connect bank
  - Unanswerable question → LLM says so gracefully, no hallucination
  - TrueLayer token expired mid-session → surface "Reconnect your bank" prompt
- ✅ **Investigated whether Call 2 was fabricating/garbling numbers, not just formatting them** — an answer's category totals didn't match a direct SQL cross-check, raising the question of whether the LLM was silently altering figures when relaying them in prose. `PROBE 3` only logged the row *count* returned by `execute_cait_query`, not its content, so there was no way to check after the fact — fixed that first (now logs full row JSON). A follow-up question with the fix live showed every single digit matching the raw query results exactly; what Call 2 actually does is take the absolute value of every figure uniformly (right call for "how much did you spend" — nobody wants "-£440.39"), not selectively per row. Confirms Call 2 is reliable on arithmetic, but also means the sign-blindness fix in Phase 5 above isn't optional — once display strips sign for readability, a correctly-negative debit and a wrongly-positive miscategorised credit render identically, so nothing downstream of categorisation can ever catch a sign mistake again.

**Concepts to cover:** text-to-SQL, two-call LLM pattern, SQL safety gates, read-only DB users, streaming responses
**Concepts covered this session:** column-level `GRANT`s to let a `SECURITY DEFINER` function's internal RLS subquery resolve without exposing the columns it merely checks; wrapping LLM-generated SQL as a subquery (`select to_jsonb(t) from (%s) t`) to make stacked-statement injection a syntax error rather than something to detect; why a model asked to reformat structured data in prose (unreliable at exact transcription) is a different risk from a model asked to make a judgement call (reasonably expected to sometimes be wrong) — the first needs a verifiable log trail to ever be ruled out, not just an instruction not to do it

---

## Phase 7 — Production Polish ⬜ Not Started
Goal: Make the app genuinely production-ready and resume-worthy.

- ⬜ Encrypt stored TrueLayer tokens in `bank_connections` using Supabase Vault or AES-256 with key in Edge Function env vars
- ⬜ Raise `net.http_post` timeout on the `categorise-backlog` cron call (default 5000ms too tight for multi-user batches; suggested 30000ms) — new migration
- ⬜ Add shared-secret check to `categorise-backlog` (e.g. `x-cron-secret` header vs Edge Function secret) so the publishable key alone can't trigger it — `verify_jwt` doesn't restrict this since the publishable key is public by design
- ⬜ Set up EAS production build: `eas build --platform android --profile production`
- ⬜ Write proper README: what the app does, tech stack table, architecture diagram (Excalidraw), screenshots of each main screen
- ⬜ Record 90-second demo video: connect bank → transactions appear → ask CAIT a question → plain English answer. Upload to YouTube (unlisted), link in README.
- ⬜ Write blog post on dev.to: "How I built a text-to-SQL chatbot over my bank data with TrueLayer and Supabase" — explain the two-call pattern, SQL safety rules, OAuth flow
- ⬜ Clean up GitHub repo: no `.env` files committed, no debug `console.log`s, tagged `v1.0` release, clean commit messages

---

## Decisions Made
| Decision | Choice | Why |
|---|---|---|
| Monorepo vs separate repos | Monorepo | Shared types, solo dev, easier to manage |
| React Native approach | Expo (managed) | No native code needed, Windows can't build locally |
| Build approach | EAS cloud builds | Required for `cait://` deep link scheme |
| Backend | Supabase | SQL + Auth + Edge Functions + RLS in one platform |
| Auth | Supabase Auth | Never roll your own auth |
| Money storage | Integer (pence) | Avoid float precision errors (`0.1 + 0.2 = 0.300000004`) |
| ORM | None (Supabase client) | Type-safe enough, ORM adds unnecessary complexity |
| Bank provider | ~~TrueLayer~~ → **Monzo Developer API** | Researched TrueLayer, Yapily, Salt Edge, Plaid, Enable Banking, GoCardless Bank Account Data, and open-banking.io for a path to real (non-sandbox) data. All the regulated aggregators gate production access behind sales conversations + KYB + (for non-regulated developers) FCA agent registration — a multi-week process built for companies onboarding many end-users, with no lighter tier for one non-commercial user. Enable Banking's free "Restricted Production" tier looked like a fit but its own docs (`/docs/markets/`, API reference examples, changelog) never mention UK coverage across four separate checks. open-banking.io is self-serve but an unverified small operator — not comfortable routing real bank consent through it. Monzo (and Starling) run first-party developer APIs built specifically for "connect only your own account": self-serve, no company, no KYB, no sales call. Since this app has exactly one real user (me), that's a better fit than fighting for aggregator production access. If a second UK bank needs supporting later, revisit an aggregator then. |
| NLQ approach | Text-to-SQL | LLM generates SELECT query → execute → summarise. Safer than RAG for structured transaction data. |
| Categorisation model | GPT-4o-mini | ~$0.02 per 1,000 transactions. Rules engine can't handle multinational merchant names. |
| Token exchange | Edge Function (server-side) | Client secret must never be exposed to the app |
| Categorisation retry model | Retry-with-attempt-cap (2 tries), not unlimited retries | Lets rows self-correct as the prompt improves, without burning OpenAI calls forever on merchants that are genuinely, permanently ambiguous |
| Category correction UX | Tap a transaction row → picker sheet (not long-press, not a dedicated screen) | Matches established budgeting-app patterns (Monzo); one tap to open, one to choose, no hidden gesture to discover |
| "General Expenses" catch-all category | Rejected in favour of targeted prompt examples | Investigated real fallback data first — nearly every case fit an existing category and just needed an explicit merchant example, not a new bucket. A vague catch-all risked becoming a second Uncategorised |

---

## Open Questions
- Encrypt bank tokens at rest? → **Yes, Phase 7. Use Supabase Vault or AES-256.**
- TrueLayer vs Plaid vs Monzo direct? → **Resolved.** Monzo's first-party API for now — see Decisions Made. TrueLayer/Plaid remain the answer if this ever needs to support other users' banks, not just mine.
- Self-host Supabase? → Not needed for v1.
- Nigeria support? → Mono (acquired by Flutterwave Jan 2026) for API. Manual CSV/PDF upload as fallback — more reliable at early stage given regulatory uncertainty.