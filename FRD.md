# Functional Requirements Document (FRD)
## SaveMyMoney

**Version:** 1.0
**Date:** March 2026
**Status:** Draft

---

## 1. System Architecture

```
┌─────────────────────────────────────────────┐
│              Mobile App (React Native)       │
│                   Expo SDK                   │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────┐
│             Backend API (Express.js)         │
│                 Prisma ORM                   │
├──────────────────────────────────────────────┤
│  Auth    │  Plaid    │  AI Pipeline  │  Jobs │
│  Module  │  Module   │  Module       │       │
└────┬─────┴─────┬─────┴───────┬───────┴───┬───┘
     │           │             │           │
┌────▼───┐ ┌────▼────┐ ┌──────▼──┐ ┌─────▼────┐
│Supabase│ │Plaid UK │ │OpenAI   │ │Cron Jobs │
│  DB    │ │  API    │ │GPT-4o   │ │(hourly   │
│  Auth  │ │         │ │  mini   │ │  sync)   │
└────────┘ └─────────┘ └─────────┘ └──────────┘
```

### Tech Stack
| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (managed workflow) |
| Backend | Node.js + Express.js |
| ORM | Prisma |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Bank Connection | Plaid UK |
| AI | OpenAI GPT-4o-mini |
| Push Notifications | Expo Notifications |
| Location / Geofencing | Expo Location (background geofencing) |
| Merchant Geocoding | Google Places API |
| Deployment | Railway (backend), Expo EAS (mobile) |

---

## 2. Database Schema

```prisma
model User {
  id                String        @id @default(uuid())
  email             String        @unique
  name              String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  notificationsEnabled Boolean    @default(false)
  notificationPrefs Json?         // { weekly: bool, milestones: bool, newTransaction: bool, locationReminders: bool }
  locationEnabled   Boolean       @default(false)

  accounts          Account[]
  transactions      Transaction[]
  categoryOverrides CategoryOverride[]
  merchantLocations MerchantLocation[]
  nlqSessions       NLQSession[]
}

model Account {
  id                String        @id @default(uuid())
  userId            String
  plaidAccountId    String        @unique
  plaidItemId       String
  plaidAccessToken  String        // encrypted at rest
  institutionName   String
  accountName       String
  accountType       String        // checking, savings, credit
  currency          String        @default("GBP")
  lastSynced        DateTime?
  isActive          Boolean       @default(true)
  createdAt         DateTime      @default(now())

  user              User          @relation(fields: [userId], references: [id])
  transactions      Transaction[]
}

model Transaction {
  id                String        @id @default(uuid())
  accountId         String
  userId            String
  plaidTransactionId String       @unique
  merchantName      String?
  rawName           String        // original name from bank
  amount            Float         // positive = debit, negative = credit
  currency          String        @default("GBP")
  date              DateTime
  category          String
  categoryConfidence Float?
  userCategory      String?       // user override
  userNote          String?
  isPending         Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  account           Account       @relation(fields: [accountId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
}

model CategoryOverride {
  id                String        @id @default(uuid())
  userId            String
  merchantName      String        // normalised merchant name
  category          String        // user's preferred category for this merchant
  createdAt         DateTime      @default(now())

  user              User          @relation(fields: [userId], references: [id])

  @@unique([userId, merchantName])
}

model MerchantLocation {
  id            String    @id @default(uuid())
  userId        String
  merchantName  String    // normalised merchant name (matches CategoryOverride)
  latitude      Float
  longitude     Float
  radius        Int       @default(200)  // geofence radius in metres
  category      String    // spending category for this merchant
  visitCount    Int       @default(0)    // derived from transaction history
  isActive      Boolean   @default(true) // false = user dismissed or disabled
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])

  @@unique([userId, merchantName])
}

model NLQSession {
  id                String        @id @default(uuid())
  userId            String
  messages          Json          // array of { role, content, timestamp }
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user              User          @relation(fields: [userId], references: [id])
}
```

---

## 3. API Endpoints

### 3.1 Auth
All auth is handled by Supabase Auth client-side. The backend receives a JWT and validates it on every request via middleware.

```
POST   /auth/register          → create user record in DB after Supabase signup
POST   /auth/delete-account    → delete all user data (GDPR)
```

### 3.2 Plaid
```
POST   /plaid/create-link-token     → generate Plaid Link token for frontend
POST   /plaid/exchange-token        → exchange public token for access token, store account
GET    /plaid/accounts              → list user's connected accounts
DELETE /plaid/accounts/:accountId   → disconnect an account
POST   /plaid/sync/:accountId       → manually trigger transaction sync
```

### 3.3 Transactions
```
GET    /transactions                → paginated list, filters: startDate, endDate, category, search
GET    /transactions/:id            → single transaction detail
PATCH  /transactions/:id            → update category or note
GET    /transactions/summary        → spending totals by category for a date range
GET    /transactions/export         → CSV download of user's transactions
```

### 3.4 NLQ
```
POST   /nlq/query                   → send natural language question, get answer
GET    /nlq/sessions                → list past NLQ sessions
```

### 3.5 Notifications
```
POST   /notifications/register      → register Expo push token
PATCH  /notifications/preferences   → update notification preferences
```

### 3.6 Location
```
GET    /locations                   → list user's saved merchant locations (for geofence setup on app start)
POST   /locations/resolve           → geocode a merchant name → { latitude, longitude }; calls Google Places API
PATCH  /locations/:id               → update radius or toggle isActive
DELETE /locations/:id               → remove a merchant location
GET    /locations/frequent          → return top 20 merchants by visitCount (used to prioritise geofences)
```

---

## 4. Functional Flows

### 4.1 Bank Connection Flow

```
Mobile                    Backend                   Plaid
  │                          │                        │
  │── POST /plaid/create ────►│                        │
  │                          │── createLinkToken ─────►│
  │                          │◄── linkToken ───────────│
  │◄── { linkToken } ────────│                        │
  │                          │                        │
  │ [Plaid Link UI opens]     │                        │
  │◄──────────────────────────────── publicToken ─────│
  │                          │                        │
  │── POST /plaid/exchange ──►│                        │
  │    { publicToken }        │── exchangeToken ───────►│
  │                          │◄── accessToken ─────────│
  │                          │                        │
  │                          │ [store encrypted        │
  │                          │  accessToken in DB]     │
  │                          │                        │
  │                          │── getTransactions ──────►│
  │                          │◄── 90 days history ─────│
  │                          │                        │
  │                          │ [AI categorise batch]   │
  │                          │ [store transactions]    │
  │◄── { success } ──────────│                        │
  │                          │                        │
  │ [Navigate to dashboard]   │                        │
```

### 4.2 Hourly Transaction Sync (Background Job)

```
Cron (every 60 min)
  │
  │── fetch all active accounts with lastSynced > 0
  │
  for each account:
  │── call Plaid /transactions/sync (cursor-based)
  │── receive: added[], modified[], removed[]
  │
  for each new transaction:
  │── check CategoryOverride table for this merchant
  │── if override exists → use it
  │── else → send to GPT-4o-mini for categorisation
  │── store transaction with category
  │
  │── update account.lastSynced = now()
  │
  │── if notificationsEnabled + newTransaction pref:
      │── send push notification via Expo
```

### 4.3 AI Categorisation

```
Input:  { merchantName, rawName, amount, currency }

Prompt to GPT-4o-mini:
  "Categorise this bank transaction into exactly one of these categories:
   Food & Drink, Transport, Shopping, Entertainment, Bills & Utilities,
   Health, Education, Eating Out, Subscriptions, Other.

   Transaction: {rawName}
   Merchant: {merchantName}
   Amount: {currency}{amount}

   Return JSON only: { category: string, confidence: number (0-1) }"

Output: { category: "Eating Out", confidence: 0.94 }
```

### 4.4 Location-Triggered Notification Flow

```
Phase 1 — Building the geofence list (runs after transaction sync)
  │
  │── query transactions grouped by merchantName, count per user
  │── identify merchants with visitCount >= 3 (threshold for "frequent")
  │── for each new frequent merchant without a MerchantLocation record:
      │── POST /locations/resolve
      │── backend calls Google Places API: "find place: {merchantName}"
      │── if confident match found → store lat/lng in MerchantLocation
      │── if no match → skip (don't geofence unnamed merchants)
  │
  │── return top 20 by visitCount to mobile app

Phase 2 — Registering geofences (runs on app foreground / location permission granted)
  │
  │── mobile fetches GET /locations/frequent
  │── calls Expo Location.startGeofencingAsync() with up to 20 regions
  │   each region: { identifier: merchantId, latitude, longitude, radius }
  │── OS now monitors boundaries in background (low power, event-driven)

Phase 3 — Geofence trigger (user enters a boundary)
  │
  │── OS fires geofence ENTER event to app (background task)
  │── app resolves merchantId → merchantName, category
  │── app queries local cached spending: how much spent in this category this month?
  │── app fires local push notification (no server call needed):
      "You're near {merchantName} — you've spent £{spent} on {category} this month"
      (if budget set: "that's £{remaining} left of your £{budget} budget")
  │
  │── notification fires once per merchant per day max (debounce)
```

`Note: geofencing is handled entirely on-device. The backend only stores coordinates
and provides them to the app — it does not receive or log the user's real-time location.`

### 4.5 NLQ Flow

```
User input: "How much did I spend on eating out last month?"

Backend:
  1. Build system context:
     - User's transaction table schema (no auth tables exposed)
     - Current date
     - User's userId (hard-coded into WHERE clause — never LLM-generated)

  2. Send to GPT-4o-mini:
     "Given this PostgreSQL schema: [schema]
      Generate a SELECT query for: [user question]
      Rules:
      - Only SELECT statements
      - Always filter by userId = '[userId]'
      - Return only the SQL, nothing else"

  3. Validate generated SQL:
     - Must start with SELECT
     - Must not contain: DROP, DELETE, UPDATE, INSERT, userId != '[userId]'
     - If invalid → return fallback error message

  4. Execute query against DB

  5. Send result + original question back to GPT-4o-mini:
     "The user asked: [question]
      The data is: [query result]
      Give a friendly, concise plain English answer."

  6. Return answer to mobile app
```

---

## 5. Security Requirements

### 5.1 Authentication
- All API routes protected by Supabase JWT middleware
- JWT validated on every request — no session storage on backend
- Tokens expire after 1 hour; Supabase handles refresh automatically

### 5.2 Data Protection
- Plaid access tokens encrypted at rest using AES-256 before storing in DB
- Raw bank API responses never logged or persisted
- User data scoped by userId at application layer AND database level (Supabase Row Level Security)
- All traffic over TLS 1.2+

### 5.3 NLQ Safety
- SQL parser validates all LLM-generated queries before execution
- Only SELECT statements permitted
- Query execution user has read-only database role
- userId always injected by application, never by LLM

### 5.4 GDPR Compliance
- Privacy policy published before launch
- Data deletion endpoint removes all user data within 30 days (includes MerchantLocation records)
- Transaction export available to users on request
- No raw email content stored (future feature)
- No data shared with third parties beyond Plaid, OpenAI, and Google Places API (all GDPR compliant)
- Location data handling:
  - The app requests background location permission solely for geofencing (boundary crossing detection)
  - The device's real-time GPS position is **never sent to the backend or stored**
  - Only merchant reference coordinates (lat/lng of a store) are stored — not user movement
  - Explicit opt-in required before requesting location permission; purpose must be clearly explained to user
  - Users can view and delete all stored merchant locations from Settings

---

## 6. Error Handling

| Scenario | Behaviour |
|---|---|
| Plaid token expired | Show "Reconnect your bank" banner in app; sync pauses until reconnected |
| Plaid API down | Queue sync retry with exponential backoff (1m, 5m, 15m, 1h) |
| OpenAI API down | Assign "Other" category; flag for re-processing when API recovers |
| NLQ query invalid SQL | Return "I couldn't understand that — try rephrasing" |
| Network timeout on mobile | Show inline error with retry button |
| User deletes account mid-sync | Cancel sync job; delete all data |
| Location permission denied | Disable location feature silently; show prompt in Settings explaining why it's needed |
| Geofence limit reached (iOS 20 max) | Keep top 20 by visitCount; re-evaluate when user visits a new merchant |
| Google Places returns no match | Skip geocoding for that merchant; retry after 3 more transactions at same merchant |

---

## 7. Categories Reference

| Category | Icon | Examples |
|---|---|---|
| Food & Drink | 🛒 | Supermarkets, corner shops |
| Eating Out | 🍔 | Restaurants, cafes, Deliveroo, UberEats |
| Transport | 🚌 | TfL, National Rail, Uber, petrol |
| Shopping | 🛍️ | ASOS, Amazon, clothes shops |
| Entertainment | 🎬 | Cinema, events, games |
| Bills & Utilities | 💡 | Rent, electricity, internet, phone |
| Health | 💊 | Pharmacy, GP, gym |
| Education | 📚 | Books, course fees, stationery |
| Subscriptions | 📱 | Netflix, Spotify, Adobe |
| Other | ❓ | Anything unrecognised |

---

## 8. Notification Templates

| Type | Trigger | Message |
|---|---|---|
| Weekly summary | Every Sunday 9am | "Last week you spent £{amount}. Your biggest category was {category}." |
| Category milestone | Category spend > 120% of last month | "You've spent £{amount} on {category} this month — more than last month." |
| New transaction | Transaction synced | "{merchant} · £{amount}" |
| Location reminder (no budget set) | User enters merchant geofence | "You're near {merchant} — you've spent £{spent} on {category} this month." |
| Location reminder (budget set) | User enters merchant geofence | "You're near {merchant} — £{remaining} left of your £{budget} {category} budget." |
