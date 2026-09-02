# Product Requirements Document (PRD)
## SaveMyMoney

**Version:** 1.0
**Date:** March 2026
**Status:** Draft

---

## 1. Overview

### 1.1 Product Vision
SaveMyMoney is a mobile app for students that automatically tracks spending by connecting to their bank account. It removes the manual logging friction that causes most budgeting apps to fail, giving students a clear, effortless picture of where their money goes.

### 1.2 Problem Statement
Students struggle to manage money not because they lack willpower, but because tracking spending manually is tedious and unsustainable. Existing solutions (spreadsheets, manual apps) require constant input and are abandoned within weeks.

### 1.3 Solution
Connect once to your bank. The app does the rest — syncing transactions automatically, categorising them with AI, and letting you ask questions about your spending in plain English.

### 1.4 Target Users
- University students in the UK (v1)
- International students especially (higher financial pressure, multiple currencies in future)
- Age 18–25, smartphone-native, low financial literacy

---

## 2. Goals

### 2.1 Product Goals
- Eliminate manual transaction logging entirely
- Give users instant visibility into spending patterns
- Make personal finance feel approachable, not stressful

### 2.2 Business Goals (Personal Project)
- Build and ship a production-ready mobile app end-to-end
- Learn the full software development lifecycle: architecture → build → deploy → maintain
- Practice ownership of UX, data privacy, and third-party integrations

### 2.3 Success Metrics (Post-Launch)
- User connects bank within first session: >80%
- Weekly active users (return at least once per week): >50%
- Transactions correctly auto-categorised: >85%
- User retention at 30 days: >40%

---

## 3. Scope

### 3.1 In Scope (v1)
- User registration and authentication
- Mandatory UK bank connection via Plaid
- Automatic transaction syncing (every hour)
- AI-powered transaction categorisation
- Spending overview dashboard (weekly/monthly)
- Category breakdown and transaction list
- Natural language querying ("how much did I spend on food this week?")
- Optional spending notifications (e.g., "You've spent £200 this month on eating out")
- Location-triggered budget reminders (notify user when near a frequently-visited merchant)
- Manual transaction notes/edits (user can rename or re-categorise a transaction)

### 3.2 Out of Scope (v1)
- US or Nigeria bank connections
- Email receipt parsing
- Payments or money transfers
- Investment tracking
- Shared budgets / household accounts
- Web app
- Social / sharing features

### 3.3 Future Scope (v2+)
- Email receipt parsing (Outlook first, then Gmail)
- US bank connections (Plaid US)
- Nigeria bank connections (Mono)
- Recurring expense detection
- Savings goals
- Multi-currency support

---

## 4. Features

### 4.1 Onboarding
- Sign up with email + password
- Brief 3-screen value explanation ("Here's what SaveMyMoney does")
- Mandatory bank connection via Plaid Link
- Immediate transaction sync on first connect
- First-time dashboard reveal

### 4.2 Bank Connection
- Powered by Plaid (UK)
- Connects to all major UK banks: Barclays, Lloyds, HSBC, NatWest, Monzo, Starling, etc.
- User authenticates directly with their bank (SaveMyMoney never sees credentials)
- Fetches up to 90 days of transaction history on first connect
- Polls for new transactions every hour in the background
- Handles token expiry gracefully — prompts re-authentication with clear messaging

### 4.3 Transaction Feed
- Chronological list of all transactions
- Each transaction shows: merchant name, amount, date, category, category icon
- Pull-to-refresh
- Tap a transaction to view detail and edit category or add a note
- Search transactions by keyword

### 4.4 Spending Dashboard
- Default view: current month
- Toggle: this week / this month / last month / custom range
- Total spent (top-level number)
- Category breakdown (bar chart or donut chart)
- Top spending categories with amounts
- Day-by-day spending sparkline

### 4.5 AI Categorisation
- Every transaction is auto-categorised on sync
- Categories: Food & Drink, Transport, Shopping, Entertainment, Bills & Utilities, Health, Education, Eating Out, Subscriptions, Other
- User can override a category — the correction is saved and learned for future similar transactions from the same merchant
- Confidence score stored internally (not shown to user in v1)

### 4.6 Natural Language Query (NLQ)
- Chat-style input on a dedicated screen
- Examples: "How much did I spend on coffee last month?", "What was my biggest purchase this week?", "Compare my spending in January vs February"
- Powered by GPT-4o-mini text-to-SQL
- Responses are plain English with supporting numbers
- Query history saved per session

### 4.7 Notifications (Optional)
- User opts in during onboarding or from settings
- Types:
  - Weekly spending summary (every Sunday)
  - Category milestone ("You've spent £150 on eating out this month — that's more than last month")
  - New transaction detected
  - Location-triggered reminder: fires when the user enters a geofence around a frequently-visited merchant (e.g. "You're near Tesco — you've spent £68 of your £100 grocery budget this month")
- User can toggle each notification type independently in settings
- Location notifications require both notification permission and location permission (always on / background)

### 4.8 Settings
- Profile: name, email, password change
- Connected accounts: view/disconnect bank accounts
- Notifications: per-type toggles
- Location: enable/disable location-triggered reminders; view and remove saved merchant locations
- Categories: default category preferences
- Data: export transactions as CSV, delete account (includes deletion of all stored location data)
- About: privacy policy, terms of service

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Transaction sync latency | New transactions visible within 1 hour |
| App load time | Dashboard visible within 2 seconds on 4G |
| AI categorisation latency | <3 seconds per batch after sync |
| Uptime | 99% (acceptable for personal project) |
| Data privacy | GDPR compliant — no raw bank data stored beyond what's needed; location used on-device only for geofencing, coordinates stored only for merchant reference points (not continuous tracking) |
| Location accuracy | Geofence radius ≥ 150m; GPS accuracy sufficient to avoid false triggers in dense areas |
| Security | All data encrypted in transit (TLS) and at rest |

---

## 6. Constraints

- Plaid UK sandbox is free; production requires Plaid approval (1–2 weeks)
- Plaid production cost: ~£1.20/connected user/month at student scale
- Google OAuth verification required for Gmail (deferred to v2)
- Must have a published privacy policy before Plaid production approval
- PSD2 limits UK transaction history to 90 days minimum (some banks offer more)

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Plaid production approval delayed | Build fully on sandbox first; use sandbox for testing |
| Bank token expiry breaks sync | Build re-auth UX from day one; treat it as a core flow not an edge case |
| AI miscategorisation | Allow easy user correction; use corrections to improve future accuracy |
| GDPR non-compliance | Write privacy policy early; never log raw bank responses; implement data deletion |
| Location permission rejected by user | Make feature clearly opt-in; explain the value before requesting permission; gracefully degrade if denied |
| iOS 20-geofence hard limit | Prioritise top 20 most frequently visited merchants; rotate geofences when user location changes significantly |
| Geocoding inaccuracy (wrong store coordinates) | Use Google Places API with merchant name + known transaction area; allow user to remove incorrect locations |
| Background location drains battery | Use geofencing (event-driven, low power) not continuous GPS polling; communicate this clearly to users |
| React Native learning curve slows frontend | Build screens one at a time; use Expo Go for fast iteration |
