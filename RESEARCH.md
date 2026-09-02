# Savings App - Technical Research Report
**Date:** March 2026 | **Author:** Research via Claude Code
**Scope:** Multi-region student budgeting app — US, UK, Nigeria
**Features in scope:** Bank connections, email receipt parsing, AI categorization, NLQ

---

## Table of Contents

1. [Bank API / Open Banking Options](#1-bank-api--open-banking-options)
   - [US](#us)
   - [UK](#uk)
   - [Nigeria](#nigeria)
   - [Multi-region options](#multi-region-options)
2. [Email Receipt Parsing](#2-email-receipt-parsing)
   - [Gmail API](#gmail-api)
   - [Microsoft Graph / Outlook](#microsoft-graph--outlook)
   - [Third-party parsing services](#third-party-parsing-services)
   - [Privacy and legal considerations](#privacy-and-legal-considerations)
3. [What Is NOT Possible or Very Difficult](#3-what-is-not-possible-or-very-difficult)
4. [AI Categorization and NLQ](#4-ai-categorization-and-nlq)
5. [Recommended Tech Stack](#5-recommended-tech-stack)
6. [Overall Verdict and Build Order](#6-overall-verdict-and-build-order)

---

## 1. Bank API / Open Banking Options

### US

#### Plaid (Primary Recommendation for US)

**What it does:**
Plaid is the dominant US bank data aggregator. It connects to 10,000+ US and Canadian financial institutions. For a budgeting app, the key product is **Transactions** — you get up to 24 months of transaction history, merchant names, amount, date, and category hints. Other relevant products:

- **Auth** — verify bank accounts (one-time fee per connection)
- **Balance** — real-time balance lookups (per-request fee)
- **Identity** — verify account holder name
- **Investments** — brokerage/investment account data
- **Liabilities** — credit cards, student loans, mortgages

**Data you can access:**
- Account name, number (masked), type, subtype
- Transaction list: date, amount, merchant name, raw description, location, category (Plaid's own taxonomy)
- Account balances (current + available)
- You do NOT get: full account numbers, CVV codes, credit score, internal bank memos, overdraft fees in real-time, or pending transactions reliably

**How it works:**
Plaid Link (a prebuilt SDK for mobile/web) handles the user authentication flow. For most banks, this is credential-based (user enters their bank login via Plaid's UI). A growing number of banks support OAuth connections (Chase, Wells Fargo, Bank of America) where users are redirected to their bank's own login. OAuth is more reliable and eliminates the credential storage problem.

**Pricing (as of early 2026):**

| Product | Fee Model | Estimated Cost |
|---|---|---|
| Transactions | Per connected account/month (subscription) | ~$1.50–$2.00/user/month |
| Auth | One-time per connection | ~$0.30–$1.00 |
| Balance | Per API call | Low per-request |
| Identity | One-time per connection | Custom |
| Sandbox | Free | Free always |

- There is **no meaningful free production tier**. The docs say "apply for Production access" and pricing is negotiated.
- The **Pay As You Go** plan has no minimum commitment; Growth and Scale plans require annual minimums (reported starting at ~$500/month).
- EU/UK customers are on Custom plans only — you must contact sales.
- **For a solo developer pre-revenue:** Plaid's sandbox is free and fully functional. Getting into production is doable but expect to talk to sales and have no free tier once you go live.

**Limitations:**
- Some smaller community banks and credit unions are not supported
- Screen scraping fallback for non-OAuth institutions (less reliable, banks try to block it)
- Connections break occasionally and require user re-authentication
- Not available in Nigeria

**Verdict for US:** Plaid is the de-facto standard. Use it. The Transactions product is what you need. Budget ~$1.50–$2.00/connected user/month in your financial model.

---

#### MX Technologies

**What it does:** MX focuses on financial data enrichment and analytics. Better known for bank-side deployments (white-labeling the "financial wellness" experience for banks) but also sells direct API access. Strong on data quality and AI-powered transaction cleansing.

**For a solo dev startup:**
- Enterprise-oriented. No meaningful self-serve tier.
- Minimum commitments are higher than Plaid.
- Better fit if you're selling to banks, not if you're building a consumer app.
- **Not recommended for your stage.**

---

#### Finicity (Mastercard Open Banking)

**What it does:** Acquired by Mastercard in 2020. Competes with Plaid in the US, strong in lending/verification use cases (income verification, asset verification). Also covers personal finance data aggregation.

**For a solo dev startup:**
- Offers "test drive" and pay-as-you-go access via Mastercard Developer portal.
- Pricing is custom / opaque — must contact sales for production.
- Less consumer app ecosystem than Plaid; fewer React Native / Flutter SDKs in the community.
- Strong alternative if Plaid pricing becomes unworkable at scale.
- **Start with Plaid; switch to Finicity if you outgrow Plaid's pricing.**

---

#### Yodlee (Envestnet)

**What it does:** The oldest data aggregator (founded 1999). Covers 20,000+ institutions globally. Used heavily in enterprise/B2B contexts.

**For a solo dev startup:**
- Base platform fees start at ~$1,000–$2,000/month minimum — not viable for a student-stage solo project.
- API documentation and SDKs are less developer-friendly than Plaid.
- **Not recommended for your stage.**

---

### UK

The UK has a fundamentally different approach from the US: it is **regulated open banking** under PSD2. All major UK banks are legally required to expose standardized APIs. This means you do not need a credential-scraping fallback — the bank APIs are the official path.

**Critical difference from the US:** In the UK, to call bank APIs as a Third Party Provider (TPP), you technically need to be **registered with or authorized by the FCA** as either an AISP (Account Information Service Provider) for read-only data or a PISP (Payment Initiation Service Provider) for payments. In practice, you do this through an **Open Banking aggregator** (TrueLayer, Yapily, etc.) who acts as the licensed TPP on your behalf. You register as their API customer, not directly with the FCA.

---

#### TrueLayer

**What it does:** Connects to all major UK banks and most EU banks. Strong for payments (VRPs, pay-by-bank) as well as data (balances, transactions). Direct connections to Lloyds, Barclays, HSBC, NatWest, Santander, Monzo, Starling, etc.

**Pricing:**
- Development tier: **Free** (sandbox/testing only, no production)
- Scale tier: Monthly base fee + per-use charges (exact figures are negotiated; not publicly listed)
- Enterprise: Custom

**Data you get:**
- Account details, balances, transactions (up to 90 days by default, some banks more)
- Transaction: amount, date, description, transaction type
- NOT available: merchant-level enrichment (you need to do your own categorization), full 24-month history (varies by bank, typically 90 days)

**Limitations:**
- Not cheap for a solo developer — expect to negotiate a small startup package or look at alternatives like Finexer (claims 90% cost savings vs TrueLayer for UK-only needs)
- FCA authorization complexity delegated to TrueLayer, which simplifies things for you

**Verdict for UK:** TrueLayer is the most battle-tested and direct for UK bank data + payments.

---

#### Yapily

**What it does:** London-based, covers UK + 18+ European countries through a single API. Similar to TrueLayer, operates as the licensed TPP.

**Pricing:**
- Sandbox: Free
- Production: Tiered (base + per-call), pricing not publicly listed — must contact sales
- "Get Set for Success" tier exists for startups but cost prediction is harder due to multi-factor billing

**Data you get:**
- Same as TrueLayer broadly: account info, balances, transaction history
- European coverage is a differentiator if you plan EU expansion

**Verdict for UK:** Strong alternative to TrueLayer. More Europe-focused. Good if you expect to expand beyond UK.

---

#### Plaid UK

Plaid covers the UK through their European open banking product. It uses the same Plaid Link SDK and developer experience you'd use for US, which is a meaningful advantage: **one SDK, one integration, covers both US and UK**.

- Covers ~2,000 European institutions
- UK products: Transactions, Auth, Identity, Balance — same products as US
- Pricing: Custom for EU/UK — must contact sales
- Trade-off: Plaid's UK coverage breadth is slightly less than TrueLayer's for very small UK banks and building societies

**Verdict for UK:** If you're already integrating Plaid for the US, extending to UK via Plaid is the lowest-effort path. UK-only coverage is slightly narrower than TrueLayer.

---

### Nigeria

Nigeria's open banking story is still maturing and has seen significant turbulence in 2025–2026. This is the hardest of the three markets.

#### The Regulatory Situation

The Central Bank of Nigeria (CBN) issued its Regulatory Framework for Open Banking in 2021 and Operational Guidelines in 2023. The formal open banking system was announced for August 2025 launch but slipped to early 2026. Key facts:

- Access to bank APIs is restricted to **CBN-licensed and supervised entities only**
- There is a mandatory **Open Banking Registry (OBR)** that all participants must join
- APIs follow RESTful standards, consent management is tied to BVN (Bank Verification Number)
- Data accessible: account balances, transaction history, identity/KYC data — with user consent

**This means:** As a solo foreign developer building a consumer app, you cannot directly call Nigerian bank APIs. You must go through a licensed intermediary.

---

#### Okra — SHUT DOWN (May 2025)

Okra was Nigeria's original open banking API startup. It shut down in May 2025 due to:
- Regulatory delays (the open banking framework enforcement kept slipping)
- Naira weakness inflating dollar-denominated cloud costs
- Better-funded rivals (Mono, Stitch) outspending them

**Do not build on Okra. It no longer operates.**

---

#### Mono — Acquired by Flutterwave (January 2026)

Mono was the leading Nigerian open banking API provider after Okra's collapse, with:
- Connections to 50+ Nigerian banks
- ~8 million linked accounts (roughly 12% of Nigeria's banked population)
- Services: account data aggregation, payments, identity verification, KYC

In January 2026, **Flutterwave (Africa's largest fintech) acquired Mono** in an all-stock deal ($25M–$40M valuation). Post-acquisition, Mono continues operating as an independent entity with no immediate leadership or operational changes.

**What this means for you:**
- Mono's APIs still work; the platform is active
- Integration with Flutterwave's broader stack (payments, compliance) is now on the roadmap
- Under Flutterwave's umbrella, Mono is more financially stable than it was as a standalone
- However, acquisition-era API strategy can shift — monitor for deprecation notices or pricing changes

**Data you get through Mono:**
- Account balances and transaction history
- Identity/KYC (BVN verification, account owner verification)
- Income insights
- Direct debit initiation

**Pricing:** Mono uses usage-based pricing. Contact their sales/developer team. They have a developer sandbox.

---

#### Stitch

Stitch is primarily South African but launched its **LinkPay** product in Nigeria using variable recurring payment (VRP) APIs. More payment-focused than data-focused in Nigeria. Raised $55M Series B in April 2025; acquired ExiPay and Efficacy Payments in 2025 to become a full-stack payments company.

**For your use case (data aggregation + transaction history in Nigeria):**
- Stitch is better for payment initiation than for transaction history/data reads in Nigeria
- Their Nigerian data coverage is narrower than Mono's
- **Better fit for the payments leg (if you want bill payment features) than the data leg**

---

#### Practical Recommendation for Nigeria

Given the regulatory complexity and market volatility, here is a frank assessment:

**Option A (Use Mono/Flutterwave):** Build on Mono's API. Accept that you're building on a recently-acquired startup in a still-maturing regulatory environment. It works today for the major Nigerian banks (GTBank, Access, Zenith, First Bank, UBA, etc.). Monitor the Flutterwave/Mono API changelog closely.

**Option B (Manual/hybrid for Nigeria MVP):** For the Nigeria MVP specifically, consider a lighter approach: manual bank statement upload (CSV/PDF parsing) + email receipt parsing, rather than live bank connection. Nigerian users are already accustomed to downloading bank statements. This avoids the regulatory and API reliability risk entirely for your early stage. Add live bank connections when Mono/Flutterwave's post-acquisition API stabilizes and when CBN's open banking enforcement is fully live.

**Option B is recommended for a solo developer's Nigeria MVP.**

---

### Multi-Region Options

| Provider | US | UK | Nigeria | Notes |
|---|---|---|---|---|
| **Plaid** | Yes (best) | Yes | No | One SDK for US+UK; must contact sales for EU/UK |
| **TrueLayer** | No | Yes (best) | No | UK/EU specialist |
| **Yapily** | No | Yes | No | UK + 18 EU countries |
| **Mono/Flutterwave** | No | No | Yes (best) | Nigeria specialist |
| **Stitch** | No | No | Partial | Nigeria payments only |
| **MX / Yodlee** | Yes | Limited | No | Enterprise-only pricing |

**Practical multi-region architecture for a solo developer:**

```
US users   → Plaid (Transactions product)
UK users   → Plaid UK OR TrueLayer (pick one; Plaid if you want one SDK)
Nigeria    → Mono API (with manual statement upload fallback)
```

There is no single provider covering all three regions. You will write an **abstraction layer** in your backend that normalizes the data from all three into a common transaction schema.

---

## 2. Email Receipt Parsing

Auto-logging spending from email receipts (Amazon orders, Uber receipts, restaurant confirmations, etc.) is a high-value feature. Here is exactly how it works and what it costs.

### Gmail API

**What you can do:**
- Read user's email messages (subject, body, sender, attachments)
- Search for emails matching queries (e.g., `from:receipts@amazon.com OR from:noreply@uber.com`)
- Parse email body (HTML or plain text) to extract merchant, amount, date, items

**OAuth Scopes Required:**

| Scope | Classification | What it allows |
|---|---|---|
| `gmail.readonly` | **Restricted** | Read all messages and settings |
| `gmail.metadata` | **Restricted** | Read metadata only (headers, labels — NOT body) |
| `gmail.modify` | **Restricted** | Read + modify (not needed for receipts) |

**All useful scopes for receipt parsing are classified as Restricted.** This triggers Google's verification process.

**The verification problem:**
- Apps with fewer than 100 users: **no verification required** (develop and test freely)
- Apps with 100+ users using restricted scopes: Must complete Google's OAuth App Verification
- If your app stores email data server-side (which receipt parsing requires): Must complete a **CASA (Cloud App Security Assessment)** annually
- CASA costs range from a few hundred to several thousand dollars per year depending on tier
- One developer reported seeing costs quoted at $15,000–$75,000 for enterprise-tier assessments (this is the worst case; developer-tier CASA is much cheaper, typically $500–$4,500)
- Timeline: 2–3 weeks for brand verification + several more weeks for restricted scope review

**Rate Limits:**
- 1 billion quota units per day per project
- ~250 quota units per message read (so ~4 million message reads/day globally)
- Per-user limit: 250 quota units/second
- In practice: rate limits are not a problem for a budget app

**Practical path for Gmail:**
1. Start with the 100-user limit (no verification needed) during development and beta
2. When you hit 100+ users, apply for Google OAuth verification and CASA
3. Build your parsing pipeline to run on-demand when user triggers sync, not continuously polling

---

### Microsoft Graph / Outlook

**What you can do:**
- Same as Gmail: read mail messages, search by sender/subject, parse body
- Microsoft Graph's `Mail.Read` permission is required

**Scope:**
- `Mail.Read` (delegated) — read user's email
- `Mail.ReadBasic` — read subject and sender but NOT body (not useful for receipts)
- You need `Mail.Read`

**How it works:**
OAuth 2.0, user consents via Microsoft login flow. Works for Outlook.com personal accounts and Microsoft 365 organizational accounts (with admin consent for org accounts).

**Verification overhead:**
Less onerous than Google's restricted scope verification. Microsoft does not require the same CASA-tier security assessment for `Mail.Read`. Publisher verification is required but it's primarily identity-based (domain verification). Lower barrier than Gmail.

**Rate Limits:**
- Microsoft Graph has service-specific throttling
- For mail: 10,000 requests per 10 minutes per app per user
- Not a bottleneck for a budgeting app

**Practical path for Outlook:** Easier to get to production than Gmail from a verification standpoint. A significant portion of students (especially in the UK and Nigeria) use Microsoft/Outlook accounts. Worth implementing.

---

### Third-Party Email Parsing Services

Rather than building your own receipt parser from scratch, you can use:

#### Nylas Email API

- Unified API for Gmail + Outlook (and IMAP in general)
- Handles OAuth for both providers, gives you normalized message objects
- Pricing: starts at ~$0.90/connected account/month
- Gives you email content in plain text or Markdown (great for LLM parsing)
- Handles the token refresh, connection management, webhook delivery
- **Best abstraction layer if you want one API for both Gmail and Outlook**

#### Parseur

- AI-powered email parsing service
- Send emails to a Parseur inbox; it extracts structured fields (merchant, amount, date)
- No code required for extraction — uses AI layout detection
- GDPR-compliant (data hosted in EU); data is never used to train their models
- Pricing: Free tier (20 pages/month), paid plans from ~$39/month
- Limitation: requires forwarding emails to Parseur, which means users must set up email forwarding rules OR you use their API to push emails to them
- Good for prototyping; less good for a seamless mobile UX

#### Mailparser

- Template-based (rule-based, not AI)
- GDPR-compliant
- Starts at ~$29.95/month for 250 credits
- Less flexible than AI-based approaches for the variety of receipt formats you'll see

#### Custom AI Parsing (Recommended for Your App)

For a budgeting app, the best architecture is:

1. **Connect email via Gmail API or Nylas** — you control the OAuth flow and data
2. **Filter emails** — use sender heuristics (known receipt senders) + subject-line keywords
3. **Parse with an LLM** — send the email body (plain text) to Claude Haiku or GPT-4o-mini with a structured extraction prompt
4. **Extract**: merchant name, total amount, currency, date, item descriptions (optional)
5. **Store** the structured transaction locally, link to the bank transaction if matched

This approach:
- Costs ~$0.001–$0.003 per email parsed (LLM costs are tiny at this scale)
- Handles any receipt format without pre-built templates
- You control the data pipeline (no third-party data processor for your users' email content beyond the LLM API)

---

### Privacy and Legal Considerations

**What you MUST do as a minimum:**

| Region | Framework | Key Requirements |
|---|---|---|
| US | No federal email privacy law; state laws vary | Clear consent at onboarding; privacy policy; data minimization |
| UK | UK GDPR (post-Brexit) | Lawful basis for processing (consent is your basis); right to erasure; data minimization; DPA registration if required |
| Nigeria | NDPA 2023 + GAID (March 2025) | User consent required; 72-hour breach notification; annual audit if "major importance" data controller |

**Critical points:**

1. **Never store full email bodies.** Parse the email, extract the structured fields (merchant, amount, date), then discard the raw email. This dramatically reduces your compliance surface area.

2. **Be explicit in onboarding.** "This app reads emails from known shopping and delivery services to automatically log your spending. We only read receipts, never personal emails, and never store your email content." Users need to see exactly what they're consenting to — especially for Google's OAuth consent screen, which will show your requested scope.

3. **Gmail restricted scope means your consent screen must explain the use clearly.** Google's review process checks that your stated use matches your actual implementation.

4. **Do not use email data to train ML models** unless you have explicit consent. Most users will not consent to this. Just use the LLM API (which does not train on your data by default, when using the API).

5. **NDPA Nigeria (2025):** The new General Application and Implementation Directive (GAID) came into effect September 2025. For a student budgeting app, you're a data controller. You need a privacy policy, a mechanism for users to request data deletion, and you should register with the NDPC if you meet the "major importance" threshold (large-scale data processing — unlikely for an MVP but plan for it).

---

## 3. What Is NOT Possible or Very Difficult

Be clear-eyed about these constraints before building.

### Hard Blockers

**1. Real-time transaction alerts (push)**
Bank APIs provide pull-based access. You call the API; you get the data at that moment. Banks do not push transaction events to you in real-time (with rare exceptions like some UK banks' event notification APIs). This means you cannot do true "you just spent £4.50 at Costa" instant alerts. You approximate this with polling (e.g., refresh transactions every hour) or by combining with Apple/Google Pay notification parsing (outside the scope of bank APIs).

**2. Data from banks that don't support your aggregator**
If a user's bank isn't supported by your aggregator, you can't connect it. In the US, ~5–10% of community banks and credit unions have issues with Plaid. In Nigeria, banks outside Mono's 50+ supported institutions are a dead end for the API approach.

**3. Credit card transaction-level data without aggregator**
You cannot call Visa/Mastercard/Amex directly for a user's transactions. You must go through the bank aggregator. There are no public Visa/Mastercard transaction APIs for third-party apps.

**4. Direct bank API calls in Nigeria without a CBN license**
The CBN framework explicitly restricts API access to CBN-licensed entities. You cannot legally call Nigerian bank APIs directly. You must go through Mono or another licensed intermediary.

**5. Accessing bank data in countries without open banking or an aggregator**
Outside US/UK/Nigeria (and a few other markets), there is often no legal path to bank data. If your users move abroad or bank internationally, you cannot aggregate those accounts.

### Difficult (but possible with trade-offs)

**6. Getting more than 90 days of UK transaction history**
UK Open Banking PSD2 mandates only 90 days of transaction history by default. Some banks offer more, but it's not guaranteed. US via Plaid typically gives 24 months.

**7. Investment account data**
Plaid's Investments product exists but coverage is limited (major brokers: Robinhood, E*Trade, Schwab, Fidelity). Smaller brokers and international investment platforms are often not connected.

**8. Manual bank entry users**
Some users will not connect their banks (privacy concerns, unsupported bank, etc.). You need a manual transaction entry flow as a fallback. This is not technically hard but is a significant UX and product scope decision.

**9. Email providers that block API access**
- **Yahoo Mail**: No public API with comparable message-reading capability. Technically has IMAP, but no modern OAuth API for third-party apps — effectively blocked for your use case.
- **Apple iCloud Mail**: No public API for third-party message reading.
- **ProtonMail**: End-to-end encrypted; cannot be read server-side even with OAuth.
- **Corporate Microsoft 365 email**: Admin consent required. Students using university email on Microsoft 365 may not be able to grant access (university IT controls this).

### Requires a Banking License (Do Not Attempt Without It)

- **Initiating payments/transfers** on behalf of users (not just reading data) requires being a licensed PISP in the UK (under PSD2) and equivalent in Nigeria
- **Holding user funds** in any form requires e-money institution authorization (UK FCA) or equivalent
- **Offering FDIC/FSCS-insured accounts** — you are not a bank
- **Providing financial advice or investment recommendations** — regulated activity in all three jurisdictions

**For a budgeting/tracking app, you need none of these.** Read-only bank data aggregation (via Plaid, TrueLayer, Mono) is the safe lane.

---

## 4. AI Categorization and NLQ

### Transaction Categorization

The goal: take a raw transaction like `"SQ *COFFEE PEDDLER 07/02 PURCHASE"` and label it as `Food & Drink > Coffee Shops`.

**Approach 1: Use the aggregator's built-in categories**
Plaid, TrueLayer, and Mono all return their own category labels with transactions. Plaid uses a two-level taxonomy (e.g., `['Food and Drink', 'Restaurants']`). Quality is decent but inconsistent — especially for newer merchants, local businesses, and non-US transactions.

**Approach 2: Fine-tuned small model (ML)**
Train a classifier on a labeled dataset of transactions → categories. Libraries: scikit-learn, fastText, or a fine-tuned BERT-class model. Works well for common patterns but requires labeled training data (which you may not have at the start) and ongoing retraining as new merchant names appear.

**Approach 3: LLM-based (Recommended for MVP)**
Send the raw transaction description (and optionally amount, merchant MCC code if available) to an LLM with a prompt like:

```
Categorize this bank transaction into one of these categories: [list].
Transaction: "SQ *COFFEE PEDDLER"
Amount: $4.50
Return JSON: {"category": "...", "subcategory": "...", "confidence": 0.9}
```

**Why LLM for MVP:**
- Zero training data required
- Handles any merchant name, including Nigerian and UK merchants
- Can explain why it categorized something (useful for user corrections)
- Costs: Claude Haiku at $1/million input tokens. A transaction description is ~20 tokens. 1,000 categorizations = ~20,000 tokens = **$0.02**. Even at 100,000 transactions/month, categorization costs are under $2. Negligible.

**Approach 4 (Scale): Hybrid**
Use LLM categorization to build a labeled dataset over time. Once you have 10,000+ labeled transactions, fine-tune a small model (BERT, or even a gradient boosted tree on TF-IDF features). Use the small model for 90% of cases (fast, cheap), fall back to LLM for low-confidence or novel merchants.

**Recommended LLM for categorization:**
- **Claude Haiku 4.5** ($1 input / $5 output per million tokens) — cheapest, fast, accurate enough for categorization
- **GPT-4o-mini** ($0.15 input / $0.60 output per million tokens) — even cheaper, good quality
- **GPT-5 Nano** ($0.05/$0.40 per million tokens) — the cheapest option, worth benchmarking

For MVP: start with GPT-4o-mini or Claude Haiku. Both are accurate and nearly free at student-app scale.

---

### Natural Language Querying (NLQ)

The goal: user types "How much did I spend on food last month?" or "Show me my five biggest purchases this week" and gets an answer.

**This is very feasible.** The architecture is called **Text-to-SQL** (or NL-to-SQL):

1. User asks a question in natural language
2. You send the question + your database schema to an LLM
3. LLM generates a SQL query
4. You execute the SQL query on your database
5. You return the results (and optionally ask the LLM to format the answer in plain English)

**Implementation with LangChain:**
LangChain has a `create_sql_agent` that handles this end-to-end. Pair it with PostgreSQL or SQLite.

```python
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import create_sql_agent

db = SQLDatabase.from_uri("postgresql://...")
llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_sql_agent(llm, db=db, verbose=True)
agent.invoke("How much did I spend on food last month?")
```

**Key design consideration — scope the schema tightly:**
Only expose the tables relevant to the user's data (transactions, categories, accounts) in the LLM's context. Never expose user table, auth table, or other sensitive tables. The LLM should only be able to generate SELECT queries on the user's own data.

**Safety guardrails:**
- Parse the generated SQL before executing — reject any non-SELECT statements
- Scope all queries to the authenticated user's ID (add `WHERE user_id = ?` before execution)
- Consider allowing only read-only DB credentials for the NLQ connection

**Feasibility verdict:**
NLQ over personal finance data is one of the best applications of LLMs available today. The queries are simple (compared to enterprise analytics), the schema is small, and the user intent is unambiguous. This feature is a strong differentiator for a student budgeting app. Build it.

**Which LLM for NLQ:**
- **GPT-4o** or **Claude Sonnet** — best accuracy for complex queries, but slower/pricier
- **GPT-4o-mini** — good accuracy for simple financial queries, fast, cheap
- **Recommendation:** Use GPT-4o-mini for NLQ. Upgrade to GPT-4o for free if query fails validation.

---

### LLM API Comparison (as of March 2026)

| Model | Input (per M tokens) | Output (per M tokens) | Best For |
|---|---|---|---|
| GPT-5 Nano (OpenAI) | $0.05 | $0.40 | Categorization (cheapest) |
| GPT-4o-mini (OpenAI) | $0.15 | $0.60 | NLQ, email parsing |
| Claude Haiku 4.5 (Anthropic) | $1.00 | $5.00 | Categorization fallback |
| Claude Sonnet 4.5 (Anthropic) | $3.00 | $15.00 | Complex NLQ, email parsing |
| GPT-4o (OpenAI) | ~$2.50 | ~$10.00 | High-stakes parsing |
| GPT-5 (OpenAI) | $2.50 | $15.00 | Best overall accuracy |

**Anthropic offers prompt caching (90% savings on repeated context) and batch API (50% discount)** — very useful if your system prompt (schema, category list) is large and reused frequently.

**Overall recommendation:** Build on **OpenAI (GPT-4o-mini)** as your primary LLM. It has the best price/performance for transaction categorization and NLQ. Use **Anthropic's batch API** for bulk re-categorization tasks (e.g., processing a month's worth of transactions). Switch to Claude Sonnet for complex document parsing if needed.

---

## 5. Recommended Tech Stack

This is optimized for a solo developer shipping a working product, not for enterprise scale.

### Mobile: React Native (with Expo)

**Verdict: React Native over Flutter for your situation.**

Here is the honest breakdown:

| Factor | React Native | Flutter |
|---|---|---|
| Language | JavaScript/TypeScript | Dart |
| Ramp-up | 2–3 weeks (if you know JS) | 4–6 weeks (Dart is new) |
| Plaid SDK support | Official `react-native-plaid-link-sdk` | Community only (no official) |
| TrueLayer SDK | React Native wrappers exist | Limited |
| Performance | Good (JSI/Fabric in RN 0.73+) | Excellent |
| Security | Good | Slightly better (compiles to ARM) |
| Community/Stack Overflow | Very large | Growing |
| Job market (if you hire later) | 6x more postings | Less |

**Why React Native wins for your project specifically:**
- **Plaid has an official React Native SDK** (`react-native-plaid-link-sdk`). For Flutter, there is no official Plaid SDK — you'd need to use Flutter's platform channels to wrap the native iOS/Android SDKs yourself. This is a significant implementation burden.
- You likely already know JavaScript/TypeScript. Don't learn Dart to ship an MVP.
- **Expo** (the managed workflow on top of React Native) dramatically reduces native build complexity for a solo developer. You can develop and test without Xcode/Android Studio for most features.

**Use Expo + React Native.** Expo's managed workflow lets you push OTA updates without going through the app store for JS changes. This is invaluable during early iterations.

**Caveat:** If you want bank-level biometric security and already know Dart, Flutter's native code compilation is an argument. But for time-to-ship for a solo developer, React Native + Expo wins.

---

### Backend: Python + FastAPI

**Why Python:**
- Best ecosystem for AI/ML (LangChain, OpenAI SDK, Anthropic SDK, pandas for transaction processing)
- FastAPI is the fastest-to-ship modern Python API framework (automatic OpenAPI docs, type validation via Pydantic)
- One person can write the backend logic, AI pipeline, and data processing all in one language
- The stack `Python + FastAPI + React Native` is described as a "full software agency in one person"

**FastAPI specifics:**
- Async support (handles concurrent bank API calls efficiently)
- Dependency injection (clean auth middleware)
- Automatic request/response validation

**Alternative: Node.js/TypeScript**
If you're already a TypeScript developer, Node.js + Express or Fastify is a valid alternative. The AI SDKs (OpenAI, Anthropic) have excellent Node.js support. The trade-off is that Python's data processing libraries (pandas, etc.) have no real equivalent in JS. For a pure API backend without heavy data processing, Node is fine.

**Recommendation:** If you are JavaScript-first, use Node.js + TypeScript + Fastify. If you are Python-comfortable or care about AI/ML flexibility, use FastAPI. Both work.

---

### Database: PostgreSQL via Supabase

**Why Supabase:**
- Fully managed PostgreSQL (not NoSQL — financial data is relational)
- Built-in authentication (save weeks of auth work)
- Row Level Security (RLS) — enforce that users can only see their own data at the database level
- Real-time subscriptions (useful for balance updates)
- Generous free tier (500MB database, 2GB file storage, 50,000 monthly active users)
- Open-source: can self-host if needed
- REST and GraphQL auto-generated from your schema
- Edge Functions (Deno) for simple serverless logic

**Why not Firebase:**
Firebase's NoSQL (Firestore) data model is awkward for financial data. Transaction records with complex queries (spending by category, by date range, by merchant) work much better in relational SQL. Supabase's cost predictability is also better for a student/side-project budget.

**Schema overview (conceptual):**

```
users (id, email, region, created_at)
accounts (id, user_id, aggregator, aggregator_account_id, bank_name, type, currency)
transactions (id, account_id, user_id, date, amount, currency, description, merchant_name, category, subcategory, source[bank|email|manual], raw_data, created_at)
email_connections (id, user_id, provider[gmail|outlook], access_token, refresh_token, last_sync)
bank_connections (id, user_id, aggregator[plaid|truelayer|mono], access_token, item_id, status)
```

---

### Email Parsing Pipeline

```
User connects Gmail/Outlook (OAuth)
  → Store encrypted tokens in Supabase (email_connections table)
  → Background job (FastAPI + APScheduler or Supabase Edge Function) runs every 6 hours
  → Fetch emails from last N days with receipt-like senders/subjects
  → For each email: send plain-text body to GPT-4o-mini with extraction prompt
  → Store extracted transaction in transactions table with source='email'
  → Dedup against bank transactions (same amount + date ± 1 day + similar merchant)
```

**Email sender list to target (start with these):**
Amazon, Uber, Uber Eats, DoorDash (US), Deliveroo (UK), Jumia (Nigeria), Bolt, PayPal, Stripe receipts, Apple receipts, Google Play receipts, airline booking confirmations, hotel bookings.

---

### Infrastructure

| Component | Service | Cost at MVP Scale |
|---|---|---|
| Backend hosting | Railway.app or Render.com | Free tier / $5–20/month |
| Database | Supabase | Free tier |
| Background jobs | FastAPI + APScheduler on Railway | Included |
| File storage | Supabase Storage | Free tier |
| Auth | Supabase Auth | Free |
| Push notifications | Expo Push Notifications | Free |
| LLM API | OpenAI (gpt-4o-mini) | ~$1–5/month at MVP scale |
| Bank connections | Plaid sandbox | Free; ~$1.50/user/month in production |

**Total MVP cost (pre-100 users):** ~$0–30/month

---

### Security Essentials

- Store all OAuth tokens (bank, email) encrypted at rest (Supabase RLS + column encryption for tokens)
- Never log raw bank API responses or email content
- Use HTTPS everywhere (Supabase and Railway enforce this)
- Rate limit your API endpoints (FastAPI middleware)
- Implement token refresh handling for both bank and email OAuth tokens
- Consider adding certificate pinning in the React Native app if you handle particularly sensitive data

---

## 6. Overall Verdict and Build Order

### Recommended Build Order for a Solo Developer

**Phase 1 — US MVP (weeks 1–8)**
1. Set up React Native + Expo project
2. Set up FastAPI backend on Railway + Supabase database
3. Integrate Plaid sandbox (Link SDK → Transactions API)
4. Build transaction display UI with manual category editing
5. Implement GPT-4o-mini categorization on transaction import
6. Ship to TestFlight/Google Play internal testing

**Phase 2 — Email Parsing (weeks 9–12)**
1. Add Gmail OAuth (use under 100 users to avoid Google verification)
2. Build email fetch + LLM parsing pipeline
3. Add Outlook OAuth (lower friction than Gmail verification)
4. Build deduplication logic between bank transactions and email receipts
5. Add email-sourced transactions to UI

**Phase 3 — NLQ Feature (weeks 13–16)**
1. Implement LangChain text-to-SQL with safety guardrails
2. Build chat UI in the app
3. Test with real student spending queries
4. Rate limit NLQ calls per user (prevent abuse)

**Phase 4 — UK Expansion (weeks 17–20)**
1. Extend Plaid to UK (or integrate TrueLayer — one integration)
2. Handle GBP currency display and formatting
3. UK-specific merchant categorization tuning
4. FCA/UK GDPR privacy policy update

**Phase 5 — Nigeria Expansion (weeks 21–28)**
1. Manual bank statement upload (CSV/PDF parsing via LLM) — lower risk than API
2. Integrate Mono API for supported Nigerian banks
3. Handle NGN currency
4. NDPA compliance review and privacy policy update

---

### Key Risks for a Solo Developer

| Risk | Severity | Mitigation |
|---|---|---|
| Plaid pricing kills margins at scale | Medium | Use Plaid at scale but model costs early; switch to Finicity or direct Open Banking at scale |
| Google verification delays Gmail receipts feature | High | Build Outlook first (lower friction); launch Gmail with <100 users, apply for verification early |
| Mono API changes post-Flutterwave acquisition | Medium | Abstract the integration behind an interface; have manual upload fallback ready |
| Nigeria CBN licensing requirements tighten | Medium | Use Mono (licensed intermediary) only; don't build direct bank connections |
| LLM API costs spike | Low | Costs are tiny at student-app scale; Claude Haiku and GPT-4o-mini are both under $2/M tokens |
| Bank connection breaking (tokens expiring) | High | Build robust token refresh and re-auth prompts in the mobile UX |

---

*This document was researched in March 2026 and reflects the state of open banking, AI APIs, and relevant regulations as of that date. APIs and pricing change frequently — verify all pricing and coverage directly with providers before building.*
