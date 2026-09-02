# Product Direction — SaveMyMoney
**Last updated:** March 2026
**Status:** In progress — positioning and direction being defined

---

## Where This Came From

This document captures the thinking from a research and positioning session covering:
- Reddit / forum research on UK university student budgeting pain points
- Deep dive into Emma (the closest UK competitor)
- Hook Model analysis of the internal trigger and positioning options
- The core emotional insight driving the product direction

---

## What the Research Found

### The Problem Is Real and Emotionally Loaded

From a 2024 Experian survey of UK students:
- **78%** say money worries cause significant stress
- **46% avoid checking their bank balance** — they know it's bad, so they don't look (ostrich effect)
- **60%** are skipping social activities because of money
- **1 in 7** considering dropping out due to financial pressure

From Blackbullion / Save the Student:
- Only **1 in 3** students budget regularly
- Only **21%** feel confident managing their money
- **34%** try to budget but can't stick to it

### Why Existing Apps Fail Students

| Pain Point | Detail |
|---|---|
| Manual entry fatigue | Logging every transaction is unrealistic — people quit in 2 weeks |
| Bank connection anxiety | Students are wary of connecting real accounts to third-party apps |
| Complexity | YNAB is powerful but built for households, not students |
| Paywalls | Emma, Snoop charge £5–15/month for anything meaningful |
| No conversational layer | Every app shows charts. None of them answer questions. |
| Student income not understood | UK maintenance loans arrive in lump sums 3x/year — no app is built around this |

---

## Emma — The Key Competitor

Emma is the closest direct competitor. Key facts:

- Founded by two Italian students studying in the UK (same origin story as this problem)
- Uses Open Banking (Yapily) to connect 50+ UK banks — same infrastructure layer as TrueLayer
- Auto-categorises transactions, flags subscriptions, lets you set budgets
- **Free tier: connect only 2 accounts** — immediately paywalled for real use
- **Pricing:** Plus £4.99 / Pro £9.99 / Ultimate £14.99 per month
- **Student loan data does not sync** — maintenance loans are classified as loans, not income. Emma can't see them automatically.
- **No AI / natural language layer** — Emma shows you a dashboard. You interpret it yourself.
- **Biggest trust problem:** aggressive upselling, unexpected subscription charges after trials
- **Known bug:** transfers between connected accounts counted as both income and expense

### Emma's Core Loop

> Anxiety → open app → see charts and numbers → still have to interpret it yourself → anxiety *partially* relieved

Emma hands you data. You still have to do the cognitive work to turn it into an answer.

---

## The Hook Model Analysis

### The Internal Trigger

Running the 5 Whys on the target user:

| Why | Answer |
|---|---|
| Why open a finance app? | To check if they have money |
| Why do they want to know? | They're about to spend something |
| Why does that feel uncertain? | They've lost track of where money went |
| Why haven't they checked already? | Checking feels bad — they're scared of what they'll see |
| Why are they scared? | **Financial anxiety. Fear of the answer.** |

The internal trigger is **financial anxiety** — but more specifically: the desire for **clarity** blocked by fear of judgment.

### The Key Insight (From the Founder, Who Is Also the User)

> *"I know how frustrating it is to look through spreadsheets just to find out if you can afford a burger."*

The anxiety isn't just "I don't know my balance." It's the **friction of finding out**. You have to want to know badly enough to open a spreadsheet, find the file, scroll through rows, do mental maths — by which point you've already talked yourself out of asking. So you don't ask. You guess. You spend. You feel worse later.

### What SaveMyMoney Does Differently

Emma's loop: data → you interpret it → partial relief
SaveMyMoney's loop: ask a question → get an answer → full relief

The NLQ (natural language query) feature is not just a nice-to-have. It's the mechanism that **completes the anxiety relief loop** that Emma leaves unfinished.

---

## The Core Emotion: Clarity

The positioning is not "anti-anxiety" (defensive, implies coping mechanism).
The positioning is **clarity** — gaining something, not just avoiding something.

The student who uses SaveMyMoney:
- **Wants** to understand their money habits
- **Doesn't want** to be judged for what they find
- **Needs** the information fast, without friction

This is not an irresponsible person. This is someone who has been **failed by the design of existing tools.**

### The Two Sides of Clarity

1. **Clarity of understanding** — *"Where did my money go?"* — looking back, understanding patterns
2. **Clarity to act** — *"Can I afford this? Will I make it to end of term?"* — looking forward, confidence to decide

**Open question (in progress):** Which moment is the sharpest pain — the one a student would tell their flatmate about?

---

## Positioning Options (Under Discussion)

| Angle | Core message | Strength |
|---|---|---|
| **Answer-first** | "Ask your money anything" | Attacks Emma's biggest gap directly |
| **Student-native** | "Built for how students are actually paid" | Niche but defensible; term loan hook |
| **Clarity** | "Finally understand your money. No judgment." | Emotionally resonant; aspirational not defensive |

**Current direction:** Clarity, with non-judgment as the tone principle and NLQ as the delivery mechanism.

---

## The Student Loan Hook (Untapped)

UK students receive their maintenance loan **3 times a year in lump sums** (October, January, April). No existing app — not Emma, not Monzo, not Snoop — is designed around this income pattern.

The moment the loan arrives is a powerful, predictable trigger:

> *"Your student loan just arrived (£3,247). Based on last term, you'll need roughly £270/week. Want a term budget breakdown?"*

This is a differentiation that can't be copied without specifically caring about students.

---

## Competitive Moat Thinking

Gourville's Law: a competitor needs to be **9x better** to break an established habit.

Emma's stored value (switching costs): connected accounts, categorisation history, budget settings.

SaveMyMoney's stored value to build toward:
- NLQ conversation history (the questions you asked, the answers you got)
- AI that learns your spending patterns, preferred categories, habits over time
- A term-budget model that understands your specific loan amount and timeline

---

## What "Good" Looks Like for This Product

A student opens the app, types "can I afford to go out tonight?" and gets:

> *"You've got £47 left in your spending budget this week. You usually spend about £25 on a night out. You're fine — go enjoy it."*

No charts. No spreadsheets. No judgment. Just an answer.

That's the product.
