# Handoff: Cait — Brand Kit & Screen Designs

## Overview
Cait ("Can I Afford IT") is a student money management app. It connects to a user's bank via Plaid (read-only), watches their spending, and answers plain-English questions about their finances. The design is warm, direct, and non-anxious — the brand voice is a smart friend, not a bank.

## About the Design Files
The files in this bundle are **high-fidelity design references built in HTML/JSX** — not production code to copy directly. Your task is to **recreate these screens in the target codebase** (React Native, Expo, SwiftUI, etc.) using its established patterns and libraries. Use the HTML as a pixel-level visual reference and the README for exact measurements and tokens.

## Fidelity
**High-fidelity.** These are pixel-perfect mockups with final colors, typography, spacing, copy, and interactions. Recreate them precisely.

---

## Design Tokens

### Colour Palette
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#f7f4f0` | App background (warm paper) |
| `card` | `#ffffff` | Card / input backgrounds |
| `tint` | `#e8ddd5` | Tinted surfaces, user chat bubbles |
| `rule` | `#e0d4c8` | Borders, dividers |
| `muted` | `#b8a89a` | Secondary text, placeholders |
| `cait` | `#9b7e6a` | Accent — Cait avatar, category dots, progress bars |
| `caitLight` | `#c4a898` | Cait accent on dark backgrounds |
| `ink2` | `#7a6355` | Tertiary text, subheadings |
| `ink` | `#2d2420` | Primary text, dark backgrounds |
| `heroBg` | `#2d2420` | Dark screen background (Decision, Splash, Thinking) |
| `warmBg` | `#f2ebe0` | Canvas/page background (not in-app) |

### Typography
**Font:** Outfit (Google Fonts), weights 300–900.

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display | 52px | 900 | Hero answers, big moments |
| Heading | 32px | 900 | Screen titles |
| Title | 22px | 800 | Cards, callouts |
| Body | 15px | 500 | Cait's explanations |
| Label | 11px | 700 | Eyebrows, meta, UPPERCASE |
| Micro | 10px | 700 | Status labels, allcaps |

Letter-spacing: −2 to −1.5 on display sizes, −0.8 on headings, 0 on body.

### Spacing & Shape
- **Screen padding:** 20–22px horizontal
- **Card border-radius:** 14–18px
- **Pill border-radius:** 999px (fully round)
- **Input height:** 50px
- **Button height:** 54px (primary), 48px (secondary)
- **Tab bar height:** 74px, `paddingBottom: 14px`
- **Status bar height:** 44px (paddingTop on all screens)

---

## Screens

### 01 — Splash (App Launch)
**Purpose:** First thing seen on app open. Brand identity moment.
- **Background:** `#2d2420` (heroBg)
- **Center layout:** flex column, centered vertically and horizontally
- **Logo mark:** 72×72px circle (`border-radius: 36px`), background `#2d2420`, border `2px solid rgba(255,255,255,0.08)`, contains a 36×36px inner circle in `#9b7e6a` (cait)
- **Wordmark:** "Cait" — Outfit 900, 56px, `#ffffff`, `letter-spacing: -2.5px`
- **Acronym row:** 3 groups: `C can I · A afford · IT it` — letter in Outfit 800 11px white, word in Outfit 500 11px `#c4a898`, separator `·` in `rgba(255,255,255,0.18)`, gap 10px between groups
- **Tagline:** "your money. no drama." — Outfit 600 13px `rgba(255,255,255,0.38)`, margin-top 28px
- **Loading dots:** 3 dots (6×6px, border-radius 3px), middle dot `#9b7e6a`, outer dots `rgba(255,255,255,0.18)`, gap 7px, absolute bottom 56px

---

### 02 — Welcome
**Purpose:** First-run welcome screen.
- **Background:** `#f7f4f0`
- **Top section:** flex 1, justify center, padding 60px 28px 0
  - 👋 emoji, 64px, margin-bottom 8px
  - "hi, I'm Cait." — Outfit 900, 52px, line-height 0.95, letter-spacing −2px
  - Subtitle — Outfit 500, 16px, line-height 1.55, color `#7a6355`, max-width 270px
- **Bottom:** padding 0 20px 44px, gap 12px
  - Primary button: "get started →" — 54px height, border-radius 27px, bg `#2d2420`, color `#f7f4f0`, Outfit 800 16px
  - Sign-in link: 13.5px, color `#b8a89a`, with underlined "sign in" in `#2d2420` 700

---

### 03 — Sign In
**Purpose:** Returning user login.
- **Eyebrow:** "welcome back" — Outfit 700, 11px, uppercase, letter-spacing 0.5, color `#b8a89a`
- **Title:** "good to see you. 👋" — Outfit 900, 34px, letter-spacing −1.2px, line-height 1
- **Fields (2):** Email address, Password
  - Each: label in Outfit 700 11px uppercase `#b8a89a`, input 50px height, bg `#ffffff`, border `1.5px solid #e0d4c8`, border-radius 14px, placeholder in Outfit 500 15px `#b8a89a`
  - Password placeholder: "••••••••"
- **Forgot password:** right-aligned, Outfit 700 12.5px, color `#7a6355`, underline offset 3px
- **Primary button:** "sign in →" — same style as Welcome
- **Footer:** "no account yet? get started" — 13px `#b8a89a` with underlined "get started" in `#2d2420` 700

---

### 04 — Sign Up (Step 1 of 3)
**Purpose:** Account creation.
- Same layout as Sign In but 3 fields: your name, email address, password
- Eyebrow: "step 1 of 3"
- Title: "create your account."
- Footer: privacy policy link instead of sign-in link

---

### 05 — Connect Bank (Step 3 of 3)
**Purpose:** Link bank via Plaid.
- Title: "connect your bank."
- Subtitle: "powered by Plaid. read-only — we can never move your money."
- Search bar: 42px height, border-radius 21px, bg `#ffffff`
- Bank grid: 2 columns, gap 10px, each tile 30×30px logo + bank name
- Trust footer: 🔒 icon + trust copy, Outfit 500 12px `#b8a89a`

---

### 06 — Home (Hidden — Default State)
**Purpose:** Home screen with balance hidden by default.
- **Header:** "hi Aanya 👋" Outfit 800 17px + "wed · week 3 of term" 11px muted. Cait avatar (34px circle) top-right.
- **Section label:** "your week so far" — 10.5px 700 uppercase muted
- **Question cards (4):** flex column, gap 9px, border-radius 16px, padding 13px 15px
  - Card 1: bg `#2d2420` (ink), white text — "can I go out tonight?" / "yes! 🍻"
  - Card 2: bg `#9b7e6a` (cait), white text — "will I make end of term?" / "looking good 📅"
  - Card 3: bg `#e8ddd5` (tint), ink text — "how am I vs last week?" / "↓ 18% 📉"
  - Card 4: bg `#ffffff` (card), ink2 text, border rule — "anything I should know?" / "nope ✨"
  - Each card: question text Outfit 600 13.5px, answer text Outfit 800 14px, right-aligned
- **Balance bar (hidden):** border-radius 999, bg card, border rule, padding 11px 18px
  - Stars "✦ ✦ ✦" Outfit 800 16px letter-spacing 4, + "show me the number" 12px muted + 👁 emoji

---

### 07 — Home (Value Shown)
**Purpose:** Balance as hero after user taps to reveal.
- Same header and question cards
- **Balance card:** bg `#2d2420`, border-radius 22px, padding 18px 20px 16px
  - Label: "left this week" — Outfit 700 10.5px uppercase `#c4a898`
  - Amount: "£47.20" — Outfit 900 52px white, letter-spacing −2.5px; ".20" in 28px `#c4a898`
  - Sub: "of £165 · resets sunday" — 12px `rgba(255,255,255,0.4)` + "hide 👁" right-aligned 11px 700 `#c4a898`
  - Progress bar: 4px height, bg `rgba(255,255,255,0.12)`, fill `#9b7e6a` at 71% width, border-radius 2px
  - Sub-bar label: "71% of the week spent · on track" — 10.5px `rgba(255,255,255,0.35)`

---

### 08 — Transactions Feed
**Purpose:** Chronological spending list.
- **Header:** "spend" eyebrow + "every receipt." heading 26px 900 + "filter" link right (13px 700 `#9b7e6a`)
- **Search bar:** 40px height, border-radius 20px, bg card, border rule, "🔍 search merchants" 13px muted
- **Day groups:**
  - Date label: 11px 700 uppercase muted (left) + day total 11.5px 700 ink2 (right)
  - Each transaction row: padding 10px 20px, border-bottom rule
    - **Merchant icon:** 38×38px, border-radius 11px, category-coloured bg, white letter (first char of merchant name), Outfit 800 15px
    - Category colours: eating out → `#9b7e6a`, groceries → `#2d2420` bg + `#c4a898` text, transport → `#7a6355`, subscriptions → `#e8ddd5` bg + `#7a6355` text
    - **Merchant name:** 14px 700 ink
    - **Category pill:** inline, bg `#e8ddd5`, border-radius 5px, padding 1px 6px, 10.5px 600 ink2
    - **Amount:** 15px 800 ink, letter-spacing −0.3px, right-aligned — format: "−£X.XX"

---

### 09 — Transaction Detail
**Purpose:** Single transaction expanded view.
- Back button (←) 36px circle bg tint, "transaction" label centered (uppercase 11px muted), spacer
- Merchant icon: 56×56px border-radius 14px, category colour bg
- Merchant name: Outfit 900 34px, letter-spacing −1.2
- Date/time: 13px muted
- Amount: Outfit 900 52px, letter-spacing −2
- Category row: card bg, border rule, 8px dot left, "category" label + name + "change" link
- Note card: card bg, italic Outfit 500 16px quote
- Cait insight: ink bg, CaitAvatar 26px + Outfit 500 13px `rgba(247,244,240,0.85)`, bold highlights white
- Footer button: "split or hide this transaction" — 48px, border rule, transparent bg

---

### 10 — Ask Cait (Empty State)
**Purpose:** Landing screen for the Ask tab before first query.
- "ask cait" eyebrow + "what do you want to know?" heading 28px 900
- 5 prompt suggestion cards: bg card, border rule, border-radius 14px, italic Outfit 500 13.5px + arrow
- Bottom input bar: 50px height, border-radius 25px, CaitAvatar 26px + placeholder + send button (40px circle ink bg)
- Tab bar active: "ask" tab

---

### 11 — Ask Cait (Thinking / Loading)
**Purpose:** Processing state shown after user submits a question.
- **Background:** `#2d2420` (heroBg)
- Question echo: 10px uppercase `rgba(255,255,255,0.35)` + 15px Outfit 500 `rgba(255,255,255,0.72)`
- Cait avatar 54px + "on it." Outfit 900 38px + "give me a second…" 13px `#c4a898`
- **C·A·I·T steps (4):**
  - Done (opacity 0.38): small letter badge `rgba(255,255,255,0.08)` bg, faded text, ✓ right
  - Active (opacity 1): letter badge `#9b7e6a` bg, white text, action text in `#c4a898`, pulse dot right
  - Pending (opacity 0.18): very faded
  - Badge: 34×34px border-radius 10px

---

### 12 — Ask Cait Response Types

#### Type 1: Decision ("can I afford X?")
- **Background:** `#2d2420`
- Verdict: Outfit 900 52px white, letter-spacing −2 — e.g. "yeah, go for it. 🍻" or "not tonight. ⚡"
- Supporting text: 15px `rgba(255,255,255,0.72)`, bold highlights white
- 3-stat grid: padding 10px, border-radius 12px, bg `rgba(255,255,255,0.07)`, label 9.5px uppercase + value 20px 800
- Follow-up chips: border `1px solid rgba(255,255,255,0.18)`, border-radius 999, 12px 600

#### Type 2: Spending Number ("how much on X?")
- **Background:** `#f7f4f0`
- Big number: Outfit 900 64px, letter-spacing −3
- 3-stat row: border-top + border-bottom rule, 9.5px uppercase label + 17px 800 value
- Calendar dots: 26×26px tiles, border-radius 8px; visited days in `#9b7e6a` (or `#A05840` for bad state), unvisited in tint

#### Type 3: Comparison ("compare X to Y")
- **Background:** `#f7f4f0`
- Two cards side-by-side, grid 1fr 1fr, gap 12px, border-radius 18px
- Good week: bg tint, 10px 700 uppercase cait label, 40px 900 amount, delta arrow + "19% less" in `#2E7D52`
- Baseline week: bg card, border rule, muted label
- Mini bar: 6px height, border-radius 3px

#### Type 4: Heads Up ("how's my X budget?")
- **Background:** `#e8ddd5` (tint)
- Verdict: Outfit 900 46px, e.g. "heads up ⚡" or "you're over. ⚡"
- Progress bar: 14px height, border-radius 7px, bg rule, fill `#9b7e6a`; overflow state adds `#A05840` right segment
- Cait note: bg card, border rule, border-radius 16px

#### Type 5: Encouragement ("am I doing okay?")
- **Background:** `#f7f4f0`
- Bar chart: 4 months, bars bottom-aligned, height varies, current month highlighted
- Good: current bar `#2E7D52`, others in tint + rule border
- Bad: current bar `#A05840`, bars rising left-to-right

#### Fallback: Conversational
- **Background:** `#f7f4f0`
- User bubbles: bg `#e8ddd5`, border-radius `18px 18px 4px 18px`, right-aligned, 14px 600
- Cait bubbles: bg `#2d2420`, border-radius `4px 18px 18px 18px`, left-aligned with 28px CaitAvatar
  - Lead line: 16px 800 white
  - Body: 13.5px `rgba(255,255,255,0.68)` line-height 1.5
- Inline data chip: bg card, border rule, border-radius 8px, 6px dot (cait or `#A05840`) + 11.5px 700 label
- Inline action pill: bg tint, border rule, border-radius 999, 12.5px 700 ink
- Follow-up suggestions: row of chips, bg card, border rule, border-radius 999, 12px 600 ink2

---

### 13 — Settings
**Purpose:** Profile, connected accounts, notifications, privacy.
- Profile card: bg ink, border-radius 18px, 44px avatar (cait bg) + name Outfit 800 18px white + email 12px `rgba(247,244,240,0.45)`
- Sections: label 10.5px uppercase muted + items separated by border-bottom rule, 13.5px 500
- Destructive item ("delete account"): color `#C43030`

---

## Interactions & Behaviour

- **Balance reveal:** Tapping the ✦✦✦ bar on Home replaces it with the Balance card (slide/fade transition)
- **Ask submit:** Keyboard dismisses → Thinking screen → response type screen (based on query classification)
- **Transaction tap:** Opens TxnDetail with slide-left transition
- **Category change:** Opens Recategorise bottom sheet (sheet slides up, dim overlay behind)
- **Tab bar:** 4 tabs — today (🏠), spend (💸), ask (✨), you (👤); active tab shows tint pill behind icon

## State Management
- `balanceVisible: boolean` — home screen balance reveal
- `currentTab: 'home' | 'txn' | 'ask' | 'me'` — active tab
- Ask query classification → response type route
- Transactions: grouped by date, each with merchant, category, amount, note

## Assets
No external image assets. All brand graphics are pure CSS/layout:
- Cait avatar: circle div, bg `#9b7e6a`, white "C" letter
- Merchant icons: rounded square, category-coloured, first letter of merchant name
- Bank logos: letter initial on brand-coloured square (used in ConnectBank only)

## Design Files
The following files are included in this bundle:
- `Cait Brand Kit.html` — main entry point (open in browser)
- `cait-bk-core.jsx` — design tokens, Phone shell, TabBar, shared atoms
- `cait-bk-screens.jsx` — all app screens (Splash → Settings)
- `cait-bk-ask.jsx` — Ask Cait response types (all states)
- `cait-bk-app.jsx` — brand kit layout and screen registry

Open `Cait Brand Kit.html` in a browser for a full visual reference.
