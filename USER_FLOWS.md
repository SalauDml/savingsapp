# User Flows
## SaveMyMoney

**Version:** 1.0
**Date:** March 2026

---

## Flow 1: Onboarding (New User)

```
App Launch
    │
    ▼
Splash Screen (SaveMyMoney logo, 1.5s)
    │
    ▼
Welcome Screen
  "Track your spending. Automatically."
  [Get Started]  [I already have an account → Log In]
    │
    ▼
Sign Up Screen
  - Email
  - Password
  - Name
  [Create Account]
    │
    ├── Error: email already exists → "An account with this email already exists. Log in?"
    ├── Error: weak password → inline validation message
    │
    ▼
Value Proposition (3 swipeable screens)
  Screen 1: "Connect your bank once"
             "We use Plaid — the same technology trusted by banks.
              We never see your login credentials."
  Screen 2: "Your spending, automatically tracked"
             "Transactions are synced hourly and categorised by AI."
  Screen 3: "Ask questions in plain English"
             '"How much did I spend on eating out last month?"'
  [Connect My Bank →]
    │
    ▼
Plaid Link (Native UI — handled by Plaid SDK)
  - User selects their bank
  - Authenticates directly with their bank
  - Grants read-only access
    │
    ├── User cancels → "You need to connect a bank to use SaveMyMoney"
    │                  [Try Again]  [Exit App]
    │
    ▼
Loading Screen
  "Fetching your transactions..."
  "Categorising with AI..."
  (animated — takes 5–15 seconds for first sync)
    │
    ▼
Dashboard (first time)
  Subtle overlay: "Your last 90 days are ready. Here's where your money went."
  [Got it →]
    │
    ▼
Dashboard (normal state)
```

---

## Flow 2: Returning User (Daily Use)

```
App Launch
    │
    ▼
Splash Screen (brief)
    │
    ├── Not logged in → Log In Screen
    │
    ▼
Dashboard
  Shows: This month's total spend
         Category breakdown
         Recent transactions (last 5)
    │
    ├── Tap category → Category Detail Screen
    ├── Tap transaction → Transaction Detail Screen
    ├── Tap "See all transactions" → Transaction Feed
    ├── Tap 💬 (NLQ) → Ask Screen
    ├── Tap 👤 (Profile) → Settings
```

---

## Flow 3: Viewing & Managing Transactions

```
Transaction Feed
  - Full chronological list
  - Filter bar: All | Food | Transport | Shopping | ...
  - Search bar (keyword search)
    │
    ▼
Tap a Transaction
    │
    ▼
Transaction Detail Screen
  Shows:
  - Merchant name (large)
  - Amount
  - Date & time
  - Category (with icon)
  - Account it came from
  - User note (if any)

  [Edit Category]  [Add Note]
    │
    ├── Tap [Edit Category]
    │       ▼
    │   Category Picker (full screen modal)
    │   Grid of all 10 categories
    │   [Save]
    │       │
    │       ▼
    │   Transaction updated
    │   Toast: "Category updated"
    │   (CategoryOverride saved for this merchant)
    │
    └── Tap [Add Note]
            ▼
        Text input modal
        [Save Note]
            │
            ▼
        Note saved, shown on transaction
```

---

## Flow 4: Natural Language Query

```
Tap 💬 on bottom nav
    │
    ▼
Ask Screen
  Header: "Ask about your spending"
  Suggested prompts:
    - "How much did I spend this month?"
    - "What's my biggest expense category?"
    - "Compare this month to last month"
    - "How much did I spend on eating out?"

  Text input at bottom
    │
    ▼
User types: "How much did I spend on coffee last month?"
[Send]
    │
    ▼
Loading indicator (1–3 seconds)
    │
    ▼
Response displayed as chat bubble:
  "Last month you spent £47.50 on coffee across 12 transactions.
   Your most frequent spot was Starbucks (7 visits)."
    │
    ▼
User can ask follow-up or new question
Conversation history shown in chat format
```

---

## Flow 5: Bank Token Expiry (Re-authentication)

```
Background sync job runs
    │
    ▼
Plaid returns ITEM_LOGIN_REQUIRED error
    │
    ▼
Backend marks account as requiresReauth = true
    │
    ▼
Next time user opens app:
    │
    ▼
Dashboard shows banner:
  "⚠️ Your {Bank Name} connection needs to be refreshed.
   Transactions may be out of date."
  [Reconnect →]
    │
    ▼
Plaid Link opens in update mode
(user re-authenticates with bank)
    │
    ▼
Access token refreshed in DB
Banner dismissed
Sync resumes immediately
Toast: "Connected. Syncing your latest transactions..."
```

---

## Flow 6: Notifications

```
Onboarding (post bank connect):
    │
    ▼
"Would you like spending alerts?"
  [Yes, turn on notifications]  [Maybe later]
    │
    ▼ (if Yes)
OS permission prompt (iOS/Android native)
    │
    ├── Denied → Notifications silently disabled, can enable later in Settings
    │
    ▼ (if Allowed)
Notification preferences screen:
  ☑ Weekly spending summary (Sundays)
  ☑ Category milestones
  ☑ New transaction alerts
  [Save]
    │
    ▼
Notifications active

---

Notification tapped (e.g. weekly summary):
    │
    ▼
App opens directly to Dashboard
(with the relevant date range pre-selected)
```

---

## Flow 7: Settings & Account Management

```
Settings Screen
  ├── Profile
  │     - Name, Email
  │     - Change Password
  │
  ├── Connected Accounts
  │     - List of connected banks
  │     - Tap to disconnect
  │         "Disconnecting will stop syncing from this account.
  │          Your existing transactions will be kept."
  │         [Disconnect]  [Cancel]
  │
  ├── Notifications
  │     - Per-type toggles (same as onboarding prefs)
  │
  ├── Data & Privacy
  │     - Export Transactions (CSV)
  │     - Privacy Policy (opens browser)
  │     - Delete Account
  │         "This will permanently delete all your data.
  │          This cannot be undone."
  │         [Type DELETE to confirm]
  │         [Delete My Account]
  │
  └── About
        - App version
        - Terms of Service
        - Contact / Feedback
```

---

## Flow 8: Empty States

| Screen | Empty State Message |
|---|---|
| Transaction Feed | "No transactions yet. Your first sync may take a few minutes." |
| Transaction Feed (filtered) | "No transactions in this category for the selected period." |
| Transaction Feed (search) | "No results for '{query}'. Try a different search." |
| Dashboard (no data) | "Hang tight — we're fetching your transactions for the first time." |
| NLQ | Suggested prompts shown until first query |

---

## Screen Map

```
                    ┌─────────────┐
                    │   Splash    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼────┐              ┌─────▼─────┐
         │ Welcome │              │  Log In   │
         └────┬────┘              └─────┬─────┘
              │                         │
         ┌────▼────┐                    │
         │ Sign Up │                    │
         └────┬────┘                    │
              │                         │
         ┌────▼────────┐                │
         │  Onboarding │                │
         │  (3 screens)│                │
         └────┬────────┘                │
              │                         │
         ┌────▼─────┐                   │
         │  Plaid   │                   │
         │  Link    │                   │
         └────┬─────┘                   │
              │                         │
              └──────────┬──────────────┘
                         │
              ┌──────────▼──────────┐
              │     MAIN APP        │
              │  (Bottom Tab Nav)   │
              └──┬──────┬──────┬───┘
                 │      │      │
          ┌──────▼─┐ ┌──▼──┐ ┌▼────────┐
          │Dashboard│ │ NLQ │ │Settings │
          └──────┬──┘ └─────┘ └─────────┘
                 │
         ┌───────▼────────┐
         │  Transactions  │
         │     Feed       │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │  Transaction   │
         │    Detail      │
         └────────────────┘
```
