# CAIT — Design Specification
**Version:** 1.0
**Date:** 28 March 2026
**Status:** Locked

---

## 1. Brand Identity

### 1.1 Name & Concept

**CAIT** — Can I Afford This?

The name works on three levels simultaneously:
- A real person's name — warm, human, approachable
- An acronym that embeds the core product question
- A personality: your friendly inner voice reminding you not to be stupid

CAIT is not a neutral financial tool. She is a character — a brutally honest, funny, non-judgmental friend who has seen your bank statements and still likes you. Every word she says, every screen she inhabits, should feel like a message from that friend.

### 1.2 Brand Voice

| Quality | What it means in practice |
|---|---|
| **Funny** | Self-aware, light-touch humour. Not jokes — a knowing tone. |
| **Non-judgmental** | Never shames the user. "You've been to Nandos 4 times" not "You're overspending on eating out." |
| **Direct** | Gets to the number fast. No filler. |
| **Feminine** | Warm and personal, not clinical or assertive. |
| **Accessible** | Talks like a friend, not a financial advisor. |

**Voice examples:**
- "You've been to Nandos 4 times this month. That's a lifestyle, not a habit."
- "£157 left this month. Yes — but it's your 5th visit. That's between you and God. 🍗"
- "You're spending 18% less on eating out than last month. Nice."
- "Either you haven't spent anything, or the sync is still catching up. We'll go with the optimistic version."
- "Heads up 👀 — you're spending more on eating out than last month. Still within budget though, so… you're fine."

---

## 2. Colour System

### 2.1 Core Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| **Background** | Warm Stone | `#f7f4f0` | All screen backgrounds |
| **Primary Accent** | Warm Brown | `#9b7e6a` | CTAs, active nav, highlights, CAIT badge |
| **Secondary Accent** | Brown Dark | `#7a6355` | Labels, secondary text, greeting text |
| **Tint** | Stone Tint | `#e8ddd5` | Category icon backgrounds, progress bar tracks |
| **Dark** | Deep Brown-Black | `#2d2420` | Headings, body text, CAIT insight cards, dark CTA |
| **Card Background** | Pure White | `#ffffff` | Category cards, transaction rows |

### 2.2 Colour Rationale

Warm Stone was chosen after extensive exploration of coral, blue, indigo, sage, and dusk/purple directions. It won because:
- Calm and grounding — directly serves the core insight that students have money anxiety and need a safe space to open the app
- Warm without being loud or feminine — universally approachable
- Parchment-like quality feels trustworthy and unhurried
- High contrast against the stone-white base — readable in all conditions

The **deep brown-black** (`#2d2420`) has a warm brown undertone that stays consistent with the stone palette, avoiding the coldness of pure black or neutral grey.

**Alternate theme (Dusk/Purple):** A soft purple direction (`#f5f2f7` background, `#7c5cbf` accent, `#1e1530` dark) is available as a Settings toggle. Not the default — discovered after use, serving as an investment/personalisation hook.

### 2.3 The 60-30-10 Rule Applied

- **60%** — Warm white `#fff9f7` — all backgrounds, breathing room
- **30%** — White `#ffffff` + coral tint `#fde8e3` — cards, surfaces, tints
- **10%** — Coral `#e8785c` + dark `#1a0a06` — accents, CTAs, CAIT cards

---

## 3. Typography

### 3.1 Type System

| Role | Typeface | Weight | Usage |
|---|---|---|---|
| **Display** | DM Serif Display | Regular | Balance number only (`£342.80`) |
| **UI** | Plus Jakarta Sans | 400–800 | All other text |

### 3.2 Type Scale

| Element | Font | Size | Weight |
|---|---|---|---|
| Balance (hero) | DM Serif Display | 40–42px | Regular |
| Screen title | Plus Jakarta Sans | 20px | 800 |
| Section label | Plus Jakarta Sans | 10px | 700, uppercase, tracked |
| Category name | Plus Jakarta Sans | 12px | 700 |
| Body / insight text | Plus Jakarta Sans | 12–13px | 500 |
| Caption / label | Plus Jakarta Sans | 9–10px | 600 |
| Micro label | Plus Jakarta Sans | 7–8px | 700–800 |

### 3.3 Typography Rationale

**DM Serif Display on the balance number only** — not on UI elements, not on headings. The balance is the single most important piece of information in the app: the thing the user opened CAIT to see. The serif makes that number feel weighty and real, slowing the eye for exactly one second on exactly the right thing. Everything else in Plus Jakarta Sans is fast, modern, and friendly.

This mixing technique (one display serif + one humanist sans) is an editorial convention that creates warmth and hierarchy simultaneously.

---

## 4. Layout & Spacing

### 4.1 Layout Philosophy

**Spacious by default. Complete on demand.**

The dashboard shows a curated view — balance, CAIT insight card, top 3 categories, Ask CAIT button. More detail is always one tap away ("See all →"). This serves the primary use context: a quick glance while out with friends, not a sit-down review session.

### 4.2 Core Layout Principles

- **Generous padding:** 18px horizontal screen padding minimum
- **Card-based surfaces:** All data lives in white cards with subtle shadow (`0 1px 6–8px rgba(201,106,80,0.07)`)
- **Rounded corners:** 10–14px on cards, 8–10px on smaller elements (consistent softness throughout)
- **Section hierarchy:** Each section has a small uppercase label + optional "See all" link
- **Bottom tab navigation:** 4 tabs — Home, Transactions, Ask Cait, Settings

### 4.3 Shadow System

All shadows use the coral accent colour at low opacity rather than neutral grey — this keeps the depth consistent with the warm palette.

```
Standard card shadow: 0 1px 6px rgba(201, 106, 80, 0.08)
Elevated card shadow: 0 2px 12px rgba(201, 106, 80, 0.12)
```

---

## 5. Key Screens

### 5.1 Home (Dashboard)

**Structure (top to bottom):**
1. Status bar
2. Greeting + balance (DM Serif) + month label
3. CAIT insight card (dark background, coral text) — 1 proactive observation
4. Section header "Where it went" + "See all →"
5. Top 3 categories (icon, name, bar, amount)
6. "Ask CAIT" CTA button (coral, full width)
7. Bottom navigation

**Design intent:** The CAIT card is the emotional core of the screen. It uses the dark background deliberately — it breaks the white card pattern and signals "this is CAIT talking, not just data." The eye goes there immediately after the balance.

### 5.2 Ask CAIT Screen

**Structure:**
1. Header: "Ask Cait" + CAIT badge (coral pill)
2. Subtitle: "Your brutally honest money friend"
3. Chat conversation (CAIT avatar = C in coral square, user bubbles in dark)
4. Suggested prompts ("Am I being stupid this month?", "How bad was I last week?", "What's draining my account?")
5. Chat input bar + send button (coral)

**Design intent:** The NLQ screen is a conversation with CAIT, not a search bar. The suggested prompts deliberately use the CAIT voice — informal and self-aware. The CAIT avatar (a small coral square with "C") appears on every response to reinforce that this is a character speaking, not a system returning results.

### 5.3 Transaction Detail

**Structure:**
1. Back button (← Transactions)
2. Merchant icon (large, tinted background) + name + amount (DM Serif) + date
3. Meta rows: Category, Account, "This month at [merchant]"
4. CAIT nudge card (white, coral left border) — contextual comment on this specific merchant

**Design intent:** The CAIT nudge on individual transactions extends the voice to the detail level. "Fifth time here this month. Honestly? Respect. But that's £87.50 on chicken. Just so you know." — the app never moralises, it just informs.

---

## 6. Component Patterns

### 6.1 CAIT Card (Insight)
- Background: `#1a0a06`
- Label: `✦ CAIT says` in coral, 8px, uppercase, tracked
- Text: white at 500 weight, key figures in coral bold
- Border radius: 12–14px
- Used on: Dashboard (proactive insight), Transaction detail (contextual nudge)

### 6.2 Category Row
- White card with coral-tinted shadow
- Left: icon in coral tint square (28–30px, 8–9px radius)
- Middle: name + progress bar (coral fill, coral tint track)
- Right: amount in Plus Jakarta Sans 700
- Stacked vertically, 7px gap

### 6.3 Ask CAIT Button
- Full-width coral background
- Left: "ASK CAIT" micro-label (7px, 800, 0.5px tracked) + "Can I afford this?" (12px, 800, white)
- Right: circular arrow icon with 20% white background
- Border radius: 10–12px

### 6.4 Bottom Navigation
- 4 items: Home, Transactions, Ask Cait, Settings
- Active state: small coral dot below icon
- Inactive: grey label text
- Border top: `1px solid rgba(201, 106, 80, 0.08)`

---

## 7. Design Principles

These are the rules that govern every decision not explicitly covered above:

1. **CAIT is a person, not a product.** Every screen should feel like she's present.
2. **The balance number is the hero.** It gets the serif, the largest size, and the most breathing room.
3. **Warmth through craft, not decoration.** No illustrations, no gradient overlays. The warmth comes from colour, type, and voice.
4. **Light as default.** Dark is reserved for CAIT's voice (insight cards) — it creates emphasis, not atmosphere.
5. **Mobile-first, outdoor-readable.** Sufficient contrast at all times. Never rely on colour alone to communicate meaning.
6. **Never shame the user.** The app observes. It does not judge.

---

## 8. What This Is Not

To stay in scope and keep the design coherent:

- **Not a dark mode app** — the Brilliant-inspired dark palette was explored and rejected. CAIT is light.
- **Not gender-neutral by design** — the name, voice, and palette are intentionally feminine. This is a feature, not an oversight.
- **Not calm or wellness-adjacent** — sage green and muted tones were explored and rejected. CAIT is warm and social, not meditative.
- **Not Monzo** — coral is distinct from Monzo's coral through the warm-white base, the DM Serif number treatment, and the specific voice. The comparison will be made; the product is different.

---

## 9. Logo

### 9.1 Mark

**Type:** Wordmark badge — the name "CAIT" set in a rectangular pill with rounded corners.

| Property | Value |
|---|---|
| Font | DM Sans Black (900 weight) |
| Text | `CAIT` — all caps, white (`#ffffff`) |
| Background | `#7a6355` (accentDark — deep warm brown) |
| Shape | Rectangle, ~13px border radius |
| Letter spacing | Default (0) |

### 9.2 Rationale

DM Sans Black was chosen over Plus Jakarta Sans ExtraBold (the UI font) and Unbounded because:
- **Legibility at small sizes** — DM Sans Black holds shape down to 44×44px app icon size; Unbounded starts to lose clarity
- **Warmth** — softer terminals than geometric alternatives; sits with the warm stone palette rather than against it
- **Weight** — 900 Black gives the badge enough visual mass to read as a logo mark, not just a label

The `#7a6355` background (accentDark) was chosen over the lighter accent (`#9b7e6a`) and the deep dark (`#2d2420`) because it reads as intentional and rich without losing the warm brown identity. It directly matches the greeting text colour on the home screen, creating visual coherence.

### 9.3 Usage

- **App icon:** 44–50px square, 11–12px border radius (iOS squircle equivalent)
- **In-app badge:** e.g. tab bar, onboarding header — same proportions scaled to context
- **Do not** use the logo badge on dark backgrounds — the deep brown disappears

---

## 10. Open Questions (for future sessions)

- Onboarding flow visual design (3-screen value prop + Plaid handoff)
- Empty state illustrations vs. icon-only treatment
- Notification design (banner style, push notification copy)
- Dark mode — if ever added, how does CAIT's voice translate to a dark surface?
