# CAIT / SaveMyMoney — Full Project Handover

**Date:** August 2026 (updated August 2026 — session 5)
**Project:** SaveMyMoney (branded as CAIT in the UI)
**Purpose:** Full orientation document — stack, status, file map, known issues, what to do next.

---

## What This App Is

A mobile budgeting app for UK university students. The core promise: connect your bank once, get your spending tracked automatically, ask questions in plain English ("how much did I spend on food last month?").

The AI assistant persona is called **CAIT**. The product docs call it **SaveMyMoney** but the UI, branding, and code use CAIT throughout.

---

## Learning Goals (Why This Project Exists)

You're building this to *learn*, not just to ship. Key topics to understand deeply, roughly in order:

1. **Row Level Security (RLS)** — how Supabase enforces "users only see their own data" at the database level
2. **OAuth 2.0 + bank connection pipeline** — TrueLayer OAuth, code exchange, token storage, token refresh
3. **Auth flows** — JWTs, sessions, token expiry, Supabase's session model
4. **Supabase Edge Functions** — serverless functions that run close to the DB, used for token exchange and AI calls
5. **React Native fundamentals** — why components re-render, how state flows through the app
6. **LLM integration** — calling an AI API, structuring prompts, parsing structured output, controlling cost

---

## Technical Stack

| Layer | Technology | Status |
|---|---|---|
| Mobile | React Native 0.81.5 + Expo SDK 54 | Active |
| Navigation | Expo Router 6 (file-based) | Active |
| Backend / DB | Supabase (Postgres + Auth + Edge Functions) | Active |
| Auth | Supabase Auth (email/password) | Working end-to-end; intermittent JSON parse error on sign-in (unresolved, low priority) |
| Bank data | TrueLayer (UK Open Banking) | Working end-to-end: OAuth, token exchange, upsert into `transactions`, refresh logic |
| AI categorisation | OpenAI GPT-4o-mini | Working: per-sync batch (`categorise-transactions`) + admin backlog sweep (`categorise-backlog`) in progress |
| Build | EAS (Expo Application Services) | Dev build on Android; use dev build, not Expo Go |

**Why these choices (settled — don't re-debate):**

| Decision | Choice | Why |
|---|---|---|
| Monorepo vs separate repos | Monorepo | Shared types, solo dev, easier to manage |
| React Native framework | Expo (managed) | Windows can't build iOS/Android locally; EAS handles it |
| Build approach | EAS cloud builds | Required for custom deep link scheme (`cait://`) |
| Backend | Supabase | SQL + Auth + Edge Functions + RLS in one platform |
| Auth | Supabase Auth | Never roll your own auth |
| Money storage | Integer (pence) | Avoids float precision bugs (`0.1 + 0.2 = 0.300000004`) |
| Bank provider (UK) | TrueLayer | UK-native, FCA-regulated, best UK bank coverage |
| ORM | None (Supabase JS client) | Type-safe enough; ORM adds unnecessary complexity |

---

## Database Schema

Tables (designed and migrated in Phase 1, RLS policies written for all):

```sql
profiles         — id (FK → auth.users), username, full_name, created_at
bank_connections — id, user_id (FK → profiles), bank_name, access_token,
                   refresh_token, token_expires_at, created_at
transactions     — id, bank_connection_id (FK → bank_connections), category_id,
                   amount (integer, pence), currency, merchant_name,
                   transaction_at, created_at
categories       — id, name, created_at
budgets          — id, user_id (FK → profiles), category_id, amount (integer, pence),
                   period (monthly/weekly), created_at
```

**RLS** is enforced on all tables. This means the Postgres database itself rejects queries that try to read another user's rows — even if the app code had a bug.

---

## Design System (Locked)

Do not change these without a deliberate decision. Defined in `apps/mobile/constants/theme.ts`.

**Palette:**
- `background: #f7f4f0` — warm off-white (app background)
- `accent: #9b7e6a` — coral/terracotta (buttons, highlights, progress bars)
- `accentDark: #7a6355` — darker coral (labels, icons, CAIT badge)
- `tint: #e8ddd5` — light warm (card borders, progress track background)
- `dark: #2d2420` — near-black (headings, body text)
- `cardWhite: #ffffff` — card backgrounds
- `textMuted: #b8a89a` — secondary text, hints

**Typography:**
- `DMSerifDisplay_400Regular` — balance figures only (the large £ number on home screen)
- `PlusJakartaSans_500Medium` — body / general text
- `PlusJakartaSans_700Bold` — medium emphasis
- `PlusJakartaSans_800ExtraBold` — headings, uppercase labels, buttons

**CAIT badge:** dark brown `#7a6355` pill → white "CAIT" text. Appears on all auth screens as the brand mark.

---

## File Map

```
savingsapp/
├── CLAUDE.md           — How Claude should behave in this project (read this)
├── PLAN.md             — Phase-by-phase build plan — update at each session end
├── RESEARCH.md         — Deep research: bank APIs, LLMs, email parsing, legal
├── USER_FLOWS.md       — All 8 user journeys mapped out (reference when building UI)
├── HANDOVER.md         — This file
│
└── apps/mobile/
    ├── app/
    │   ├── _layout.tsx             — Root: font loading, auth guard, session listener,
    │   │                             deep link handler for TrueLayer callback
    │   ├── modal.tsx               — Placeholder modal
    │   ├── auth/
    │   │   └── callback.tsx        — Receives TrueLayer OAuth redirect, calls
    │   │                             exchange-token Edge Function
    │   ├── (auth)/
    │   │   ├── sign-in.tsx         — Email/password sign in
    │   │   ├── sign-up.tsx         — Sign up + writes full_name to profiles table
    │   │   └── connect-bank.tsx    — Opens TrueLayer sandbox OAuth URL
    │   └── (tabs)/
    │       ├── _layout.tsx         — Tab navigator: Home, Transactions, Ask CAIT, Settings
    │       ├── index.tsx           — Home dashboard (mock category data + connect-bank banner);
    │       │                         calls fetch-transactions then categorise-transactions on mount
    │       ├── transactions.tsx    — Real SectionList grouped by date, real-time subscription,
    │       │                         pull-to-refresh; shows joined category name per row
    │       ├── ask-cait.tsx        — Stub: "Coming soon" (Phase 6, not started)
    │       └── settings.tsx        — Sign out only
    │
    ├── components/
    │   ├── cait-insight-card.tsx   — Dark card: "✦ CAIT says" with amount highlighting
    │   └── category-row.tsx        — Emoji + name + progress bar + amount
    │
    ├── constants/
    │   └── theme.ts                — Colors, Fonts, Shadows tokens
    │
    └── lib/
        └── supabase.ts             — Supabase client (AsyncStorage for session persistence)
```

There is also a `supabase/` directory at the root (not visible in `apps/mobile`) containing:
- `supabase/functions/exchange-token/index.ts` — exchanges the TrueLayer OAuth code for tokens, inserts into `bank_connections`
- `supabase/functions/fetch-transactions/index.ts` — pulls transactions from TrueLayer, upserts into `transactions`, handles token refresh
- `supabase/functions/webhook-truelayer/index.ts` — HMAC-verified webhook receiver, built but not registered (TrueLayer Data API doesn't push real-time events — async job model instead)
- `supabase/functions/categorise-transactions/index.ts` — client-triggered, per-user, categorises up to 50 uncategorised transactions via GPT-4o-mini after each sync
- `supabase/functions/categorise-backlog/index.ts` — admin/service-role job meant to run on a schedule, sweeps up to 100 uncategorised transactions *across all users* per invocation (for backlogs bigger than 50), groups by user via `bank_connections`, categorises + upserts per user
- `supabase/migrations/` — schema, RLS policies, and the `claim_uncategorised_transactions` RPC (claim-then-expire pattern for safe concurrent backlog processing) all live here as versioned SQL

---

## What's Built (Phase-by-Phase)

### Phase 1 — Foundation ✅ Complete

- Supabase project created, schema migrated, RLS policies written
- Supabase client in `lib/supabase.ts` with `AsyncStorage` for session persistence
- Auth screens: sign-in and sign-up
- Sign-up writes `full_name` to `profiles` table after auth
- Root layout listens to `supabase.auth.onAuthStateChange` → redirects to `/(tabs)` or `/(auth)/sign-in`

### Phase 2 — App Shell ✅ Complete

- Tab navigator with four tabs
- Home screen with CAIT visual design
- `CaitInsightCard` and `CategoryRow` components
- All auth screens styled to CAIT brand identity
- Transactions, Ask CAIT, Settings screens exist (placeholders)

### Phase 3 — Bank Connection (TrueLayer) ✅ Complete

- `connect-bank.tsx` opens the TrueLayer sandbox OAuth URL (scopes: `accounts transactions`, redirect: `cait://auth/callback`, mock bank: `uk-cs-mock`)
- `auth/callback.tsx` receives `?code=` from the deep link, calls `exchange-token` via `supabase.functions.invoke` with explicit `Authorization: Bearer ${session.access_token}`
- `exchange-token` Edge Function exchanges the code for tokens and inserts into `bank_connections` end-to-end (the earlier 400 blocker was resolved — root causes were the auth header and env var issues described in "Concepts covered" below)
- `fetch-transactions` Edge Function: reads `access_token`, calls TrueLayer `GET /data/v1/transactions`, **upserts** (not inserts — TrueLayer can return overlapping date windows) into `transactions`
- Token refresh built into `fetch-transactions`: checks `expires_at`, calls TrueLayer `POST /connect/token` with `grant_type=refresh_token` when needed
- `webhook-truelayer` Edge Function built (HMAC-SHA256 signature verification, service-role client) but **not registered** — TrueLayer Data API is async-job-based, not push notifications. Transactions refresh on app open + pull-to-refresh instead.

### Phase 4 — Displaying Real Transactions ✅ Complete

- `transactions.tsx`: real `SectionList` grouped by date, pulling from Supabase (not mock data)
- Each row: `merchant_name`, amount (pence ÷ 100, formatted `£X.XX`), `transaction_at`, joined category name
- Pull-to-refresh, plus a Supabase real-time subscription (`postgres_changes` on `transactions` INSERT) that refetches automatically

### Phase 5 — AI Categorisation 🔄 In Progress

- `categorise-transactions`: client-triggered (chained after `fetch-transactions` on Home screen mount), per-user, batches up to 50 uncategorised transactions per call to GPT-4o-mini, validates the LLM's response before writing (`validateCategorisations` safety gate — drops unknown transaction ids, falls back unknown category ids to "Uncategorised")
- **Gap this solved:** a single user's history can exceed 50 uncategorised rows, and `categorise-transactions` only ever processes one batch per app-open. `categorise-backlog` is the fix — an admin job, not user-triggered:
  - `claim_uncategorised_transactions` Postgres RPC (migration `20260711000001`) atomically claims a batch *across all users* using `FOR UPDATE SKIP LOCKED`, stamping `claimed_at` so a crashed run's claim expires after 5 minutes and becomes claimable again
  - The Edge Function groups claimed rows by owning user (via `bank_connections`), then does one categories-fetch + OpenAI call + upsert per user
  - ✅ Scheduled via `pg_cron` + `pg_net`: migration `20260715000000_schedule_categorise_backlog.sql` runs the function every 5 minutes
  - ✅ Deployed to the hosted project (`supabase functions deploy categorise-backlog`) — it existed in the repo since session 3 but was never actually live until session 4
  - ✅ Verified working end-to-end: `cron.job` shows the job registered, `cron.job_run_details` shows successful runs, `net._http_response` confirmed a 200 with `transactions` rows actually getting `category_id` updates
  - 🔜 **Deferred to Phase 7 — timeout risk:** `net.http_post` defaults to a 5000ms timeout; one run already hit it (`timed_out: true`, DNS/handshake only ~56ms of the 5s). The function makes one sequential OpenAI call per distinct user in the claimed batch before responding, so bigger backlogs will exceed 5s. The Edge Function's work likely still completes when this happens (the timeout is `pg_net` giving up on the response, not the function being killed), but it means we lose the ability to confirm success/failure for larger runs. Fix: bump `timeout_milliseconds` on the `net.http_post` call (suggest 30000ms) in a new migration.
  - 🔜 **Deferred to Phase 7 — no real auth on the endpoint:** `categorise-backlog` currently accepts any caller with a plausible Supabase key in `Authorization`, including the publishable key used in the cron job — which is public (ships in the mobile app bundle, so the project URL and function slug are discoverable). `verify_jwt: true` doesn't block this since the gateway accepts the publishable key. Fix: add a shared-secret check inside the function (compare a custom header like `x-cron-secret` against an Edge Function secret), independent of `verify_jwt`.

**Session 5 — chased down why ~82% of transactions were landing on Uncategorised, fixed it, and made it self-correcting:**

- Investigated with direct SQL against `transactions`/`categories` (not guessing) — found `category_id` was non-null but pointing at the real Uncategorised category, and the *same merchant string* (`SAVE THE CHANGE`) got different categories across duplicate rows in one batch. That's the signature of non-determinism, not a validation bug.
- Root cause: `categorise-transactions` (the client-triggered, per-sync path) was still running the *old* weak prompt at default OpenAI `temperature` (1.0) — it never got the `temperature: 0` + rewritten-prompt fix `categorise-backlog` already had from an earlier session. Brought both functions to parity: same prompt, `temperature: 0`, `kind` field included in what's sent to the model.
- `categorise-backlog`'s `BATCH_SIZE` dropped 100 → 25 — Edge Function logs (the PROBE-style logging already built into the function) showed `sent=100 returned=93` (7 rows silently skipped by the model) and fallbacks skewed toward the back half of its own output — a "coasting through a long batch" pattern.
- Added explicit merchant-pattern examples to both prompts for real gaps the model kept missing despite general rules already covering them in principle: round-ups (`SAVE THE CHANGE` — Monzo's actual feature name), crypto/trading platforms → Transfers, betting/gaming operators → Entertainment, wholesalers (`Booker`) → Groceries.
- **Result, verified by SQL:** fallback rate went from 543/661 (≈82%) to ~21 total rows on the first full reprocess with the fixed prompt.
- Found and fixed the deeper structural bug underneath all of this: **both pipelines only ever checked `category_id is null`** to decide "needs categorising." Once any row fell back to the real (non-null) Uncategorised category — even under the old broken prompt — it became permanently invisible to reprocessing, forever, no matter how good the prompt got later. Fixed with a new `categorisation_attempts` column (migration `20260819000000`): `claim_uncategorised_transactions` now also retries Uncategorised rows, capped at 2 attempts total, so genuinely-ambiguous merchants don't get re-sent to OpenAI forever for zero benefit.
- Added an idle guard to the cron (migration `20260818000000`) so it skips the `net.http_post` call entirely when there's no claimable backlog, instead of firing every 5 minutes forever regardless of whether there's work — then had to re-sync that guard's "is there work" condition (migration `20260819000001`) after the retry change above widened what counts as claimable, or the guard would've silently gone stale.
- Considered and rejected adding a vague "General Expenses" catch-all category — checked the actual fallback data first, and nearly every case fit an existing category (`Groceries`, `Transfers`, `Entertainment`, `Bills & Subscriptions`) and just needed an explicit prompt example, not a new bucket. A catch-all risked becoming a second Uncategorised.
- Added manual recategorisation to the UI: tap a transaction row in `transactions.tsx` → category picker sheet → writes `category_id` directly via Supabase (RLS already permits it) and jumps `categorisation_attempts` to the cap so the automatic sweep can never overwrite a human's explicit choice.
- Fixed the UI conflating "not yet processed" with "the model's actual Uncategorised answer" — both used to render as the identical string "Uncategorised". Now: `not categorised yet` (italic, faded) vs `Uncategorised` (normal).

**Still open:** replace mock `CategoryRow` data on Home screen with real grouped totals (`SUM(amount_pence) GROUP BY category_id`)

### Phase 6 — Ask CAIT (NLQ Chatbot) — Not Started

- Text-to-SQL approach settled (see Research Decisions below), not yet built

See `PLAN.md` for the authoritative phase-by-phase task list — it's more current than this file for day-to-day tracking; this file is the broader orientation doc.

---

## How Auth Works (End-to-End)

```
Sign-up:
  1. User submits form
  2. supabase.auth.signUp({ email, password })
  3. Supabase creates user in auth.users, returns a JWT session
  4. App writes full_name to profiles table
  5. onAuthStateChange fires → _layout.tsx redirects to /(tabs)

App restart:
  1. _layout.tsx calls supabase.auth.getSession()
  2. Supabase checks AsyncStorage for a persisted session token
  3. If valid → /(tabs). If expired/missing → /(auth)/sign-in
```

**JWT** = JSON Web Token. A signed string proving who the user is. Contains user ID + expiry time. Supabase auto-refreshes it silently (`autoRefreshToken: true` in the client config).

---

## How the Bank Connection Works (TrueLayer OAuth)

```
1. User taps "Connect your bank" in connect-bank.tsx
2. App calls Linking.openURL() with the TrueLayer OAuth URL:
   — client_id, scopes (accounts transactions), redirect_uri (cait://auth/callback)
   — sandbox mock bank provider: uk-cs-mock
   — user_email from Supabase session (required by TrueLayer)
3. Browser opens; user picks mock bank and authenticates
4. TrueLayer redirects to: cait://auth/callback?code=XXXXXX
5. Android OS sees the cait:// scheme, opens the dev build app
6. Expo Router routes to app/auth/callback.tsx
7. callback.tsx reads ?code= and calls exchange-token Edge Function via
   supabase.functions.invoke('exchange-token', { body: { code }, headers: { Authorization: `Bearer ${session.access_token}` } })
   — the JWT is sent explicitly so the Edge Function can identify the user
8. [Edge Function] Extracts Authorization header, creates Supabase client forwarding the JWT
9. [Edge Function] Calls TrueLayer POST /connect/token with code + client credentials
10. [Edge Function] Gets { access_token, refresh_token, expires_in }
11. [Edge Function] Calls supabase.auth.getUser() to get user ID from JWT (not from request body)
12. [Edge Function] Inserts into bank_connections table — RLS applies because JWT identifies the user
13. App navigates to /(tabs) on success
```

**The key concept here is OAuth 2.0.** The `code` is a short-lived, single-use credential. You exchange it for real tokens. You never store the code — only the tokens. The reason for this two-step dance (code → token) is that the code travels through the browser redirect URL (which is less secure), while the real tokens are only fetched via a server-to-server call with your client secret.

---

## Environment Variables

Required in `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://dbpzbzwrzwnfwaxtzyic.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your anon key>
EXPO_PUBLIC_TRUELAYER_CLIENT_ID=sandbox-cait-2d49e4
```

Required in Supabase Edge Function secrets (via Supabase dashboard):
```
TRUELAYER_CLIENT_ID=sandbox-cait-2d49e4
TRUELAYER_CLIENT_SECRET=<your TrueLayer sandbox secret>
```

**Note on Supabase key system (new projects, post-June 2025):**
- `anon` and `service_role` keys are legacy. New projects use `sb_publishable_...` and `sb_secret_...` keys.
- `SUPABASE_SECRET_KEYS` is a **built-in** env var inside every hosted Edge Function — it's a JSON dictionary: `{ "default": "sb_secret_..." }`. Parse it with `JSON.parse(...)['default']` — do NOT pass it raw to `createClient`.
- `SUPABASE_PUBLISHABLE_KEY` is NOT a built-in for hosted Edge Functions (only works locally via CLI). Do not use it in Edge Function code.
- `supabase.functions.invoke` from the mobile client does NOT automatically add auth headers in all cases. Always pass `Authorization: Bearer ${session.access_token}` explicitly in the headers option.

---

## Running the App

```bash
cd apps/mobile
npx expo start
```

Use `npx expo start` (not `npm start`). Scan the QR code using the **EAS dev build app** on your Android phone — not Expo Go. Expo Go can't handle the `cait://` deep link scheme needed for the TrueLayer OAuth callback.

---

## Known Issues

| Issue | File | Severity |
|---|---|---|
| Sign-in intermittently throws JSON parse error ("unexpected e") — suspected publishable key issue in `.env` | `apps/mobile/.env`, `lib/supabase.ts` | High — unresolved, not touched this session |
| `categorise-backlog`'s `pg_net` call can time out (5000ms default) once a batch spans several users, since each user gets a sequential OpenAI call before the function responds | `supabase/migrations/20260715000000_schedule_categorise_backlog.sql` | Medium — job still runs; timeout only breaks visibility into success/failure for large batches. Deferred to Phase 7. |
| `categorise-backlog` has no real authentication — accepts any caller with a valid-shaped Supabase key, including the publishable key, which is public (ships in the mobile app bundle) | `supabase/functions/categorise-backlog/index.ts` | Medium-High — anyone who finds the URL can trigger OpenAI-billed calls. Deferred to Phase 7. |
| Home screen balance/category totals still hardcoded mock data (transactions screen is real; home isn't) | `app/(tabs)/index.tsx` | Expected — remaining Phase 5 work |
| Bank token encryption not yet decided (Vault vs AES-256) | `PLAN.md` open questions | High for production, deferred to Phase 7 |
| No `Database` type generation (`supabase gen types typescript`) — Edge Functions have several untyped `any` fields (e.g. `.rpc()` return in `categorise-backlog`) | all `supabase/functions/*/index.ts` | Low — cosmetic TS errors only, flagged not yet fixed |
| Categorisation prompt duplicated across two Edge Functions (`categorise-transactions`, `categorise-backlog`) — already drifted apart once (session 5 found `categorise-transactions` running a stale, weaker prompt) | `supabase/functions/categorise-transactions/index.ts`, `supabase/functions/categorise-backlog/index.ts` | Medium — fix is a shared module (e.g. `supabase/functions/_shared/categorise-prompt.ts`), not urgent but will drift again if not done |
| The `2`-attempt retry cap is a magic number duplicated in two places (RPC default parameter, cron guard SQL) — changing it means updating both in sync | `supabase/migrations/20260819000000_...sql`, `supabase/migrations/20260819000001_...sql` | Low — works today, just fragile to change later |

---

## Research Decisions Already Made (Don't Re-research)

From `RESEARCH.md`:

- **UK bank data:** TrueLayer. If expanding to US, use Plaid (one SDK covers US + UK).
- **Nigeria:** Mono (acquired by Flutterwave Jan 2026) for API; manual bank statement upload (CSV/PDF) as fallback — more reliable at early stage given regulatory uncertainty.
- **AI categorisation model:** GPT-4o-mini. ~$0.02 per 1,000 transactions. LLM approach beats rules engine for multinational merchant coverage.
- **NLQ ("how much did I spend on..."):** Text-to-SQL. LLM generates a SELECT query → you execute it → return plain-English result. Safety rule: always append `WHERE user_id = ?` before running any generated query.
- **Email receipts:** Build after bank connection is stable. Gmail API needs Google verification at 100+ users; Outlook/Microsoft Graph has lower friction.
- **LLM cost reality:** At student-app scale, LLM costs are negligible. Claude Haiku and GPT-4o-mini are both under $2/million tokens.

---

## The Learning Pattern for Each Phase

Based on CLAUDE.md:

1. Claude explains **what** we're about to build and **why** this approach
2. You attempt a first version
3. Claude reviews, fills in gaps, explains what you missed
4. You ask questions, then we refine together

**Concepts covered in session 2:**
- Supabase new API key system — `sb_publishable_` replaces anon, `sb_secret_` replaces service_role
- `SUPABASE_SECRET_KEYS` is a built-in JSON dict in Edge Functions — must be parsed, not used raw
- Supabase Edge Function auth — the gateway requires `Authorization` or `apikey` header before your code runs
- Option B client pattern — forward user JWT into `createClient` global headers so RLS applies in Edge Functions
- Deno vs Node.js — different runtime, different env access (`Deno.env.get`), URL imports instead of npm

**Concepts covered in session 3 (categorise-backlog):**
- **Service-role client vs RLS** — a service-role Supabase client bypasses RLS entirely, which means an admin job has to hand-write the "user_id is null or mine" filter that RLS used to do for free. Get this wrong and you leak other users' custom categories into a prompt/upsert.
- **PostgREST filter syntax** — raw `.or()`/`.filter()` strings follow `column.operator.value` (dot-separated); dropping a dot (`eq${x}` vs `eq.${x}`) silently breaks the query.
- **Claim-then-expire pattern** — `FOR UPDATE SKIP LOCKED` + a `claimed_at` timestamp lets multiple job runs safely process a shared queue without double-processing a row, and lets a crashed run's claim self-heal after a timeout instead of needing manual cleanup.
- **API-key vs authorization** — the Authorization header only needs to pass Supabase's gateway check; it doesn't automatically grant permissions inside your function's own code. Which key to use for a machine-to-machine call (like a cron job) should be judged by what the *code* does with it, not just "use the powerful one to be safe."
- **pg_cron + pg_net** — running scheduled jobs and outbound HTTP calls from inside Postgres itself, so a background sweep doesn't depend on a user opening the app.

**Concepts covered in session 4 (scheduling + deploying `categorise-backlog`):**
- **Repo vs deployed** — a file existing in `supabase/functions/` is not the same as it being live; `categorise-backlog` sat undeployed for days despite being fully written. `supabase functions list` is the source of truth for what's actually running.
- **`pg_cron` + `pg_net` mechanics** — `cron.schedule(name, cron_expr, sql)` re-running with the same job name updates it in place rather than creating a duplicate; dollar-quoting (`$$...$$`) avoids escaping nested single quotes in the inner SQL string; `net.http_post` is fire-and-forget — Postgres queues the request and moves on, it doesn't block waiting for the HTTP response.
- **Reading `pg_net`'s response log** — `cron.job_run_details` only confirms the *SQL call* (`select net.http_post(...)`) succeeded, not that the HTTP request itself got a good response. The actual outcome — status code, body, or `timed_out`/`error_msg` on failure — lives in `net._http_response`, a separate table populated asynchronously once the request completes.
- **A timeout isn't necessarily a failure** — `net.http_post`'s default 5000ms timeout can elapse before a slow Edge Function responds, but the function keeps running server-side; the timeout only means Postgres stopped waiting to log the outcome, not that the work was cancelled.
- **`verify_jwt` isn't real access control when the credential is public** — the gateway accepted the mobile app's publishable key (confirmed by the request taking the full 5s doing real work, not an instant rejection), but that key ships inside the client app bundle by design. A toggle that says "yes" to a credential anyone can extract from your APK isn't restricting anyone. The actual fix for restricting a machine-only endpoint is a secret only the caller and the function know (e.g. a custom header checked in code), independent of `verify_jwt`.

**Concepts covered in session 5 (chasing and fixing the Uncategorised fallback rate):**
- **`temperature` in LLM APIs** — controls how much randomness the model injects into token selection; `0` is near-deterministic (same input → same output), the default (`1.0`) is not. The tell was the same merchant string getting different categories across duplicate rows in one batch — that's a sampling signature, not a logic bug, and no amount of staring at `validateCategorisations` would have found it.
- **Large single-shot batches degrade LLM output** — asking a model (especially a small one like gpt-4o-mini) to process 100 items in one completion risks both truncation (`finish_reason: "length"`) and a "lost in the middle" effect where quality drops the further into the list the model gets. Evidence: `sent=100 returned=93`, and fallbacks concentrated in the back half of the model's own output order.
- **Two different failure modes look identical in the database** — "the model hallucinated a category_id and the safety net caught it" (`validation-forced`) vs "the model itself decided Uncategorised was correct" (`model-fallback`) both just write the same fallback row. Raw counts of Uncategorised rows can't distinguish them; you need the discriminator logged at the point of decision (this is exactly what the PROBE-style `console.log`s in `categorise-backlog` were built for).
- **A "one-way door" bug** — a WHERE clause meant to mean "still needs work" (`category_id is null`) also silently meant "never look at this row again" the moment *any* value got written to it, including a fallback placeholder. The fix isn't just "retry more" — it's recognising that "categorised" and "correctly categorised" are different states, and building a column (`categorisation_attempts`) that can tell them apart.
- **Retry-with-attempt-cap** — the general pattern for "some failures are worth retrying, some aren't, and you can't always tell which in advance": try a bounded number of times, then treat it as a resting state rather than retrying forever. Applies far beyond this app (webhook delivery, background jobs, anything hitting a flaky or fundamentally-limited dependency).
- **`pg_cron` fires on schedule regardless of whether previous work finished** — because the job's SQL body is just `net.http_post(...)`, which returns instantly (fire-and-forget), there's nothing for the next scheduled tick to wait on even in principle. Safe here specifically because of the claim-then-expire locking pattern (`FOR UPDATE SKIP LOCKED` + `claimed_at`) already in place — overlapping invocations just skip whatever's already locked instead of double-processing.
- **A guard condition can go stale** — the cron's "is there work to do" check has to be kept in sync with whatever the claim function actually considers claimable. Widening the claim logic (to include retries) without updating the guard would have made the cron silently stop firing while real work sat unprocessed — a bug introduced and caught in the same session, not shipped.
- **Investigate before adding schema** — the instinct to add a "General Expenses" catch-all category was checked against real data first. Walking the actual fallback list showed nearly every case fit an existing category and just needed a better prompt example, not a new bucket — a vague catch-all would have quietly become a second Uncategorised.
- React Native `Pressable`'s function-as-style prop (`style={({ pressed }) => [...]}`) for press-state feedback without extra `useState`, and the nested-`Pressable` trick (inner one with a no-op `onPress`) for "tap outside to close" modal sheets.

**Concepts still to cover:**
- Fixing the two open items above: `net.http_post` timeout margin, and adding a shared-secret check to `categorise-backlog`
- **RLS in practice** — test that users can only see their own bank_connections rows
- Text-to-SQL safety gates for Phase 6 (Ask CAIT)
