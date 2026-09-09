// Shared by index.tsx and transactions.tsx so the "how do we turn a set of
// transaction rows into a spent figure" math exists in exactly one place —
// this project already had prompt drift once from duplicating logic across
// files (see PLAN.md Phase 5), and the sign bug this fixes is exactly that
// kind of drift: index.tsx and transactions.tsx had each grown their own
// slightly-wrong copy of this.
//
// transactions.amount is negative for spending, positive for income (see
// ask-cait/index.ts's schema prompt) — summing raw amounts and taking
// Math.abs() of the NET total is wrong whenever a period mixes a purchase
// and a refund in the same category: e.g. a £50 purchase (-5000) and a £200
// refund (+20000) net to +15000, and Math.abs(15000) reports "£150.00
// spent" for a period the user actually came out £150 ahead in.
//
// Negating each row before summing (matching ask-cait's SUM(-t.amount))
// gives the correct net-spend figure instead: -(-5000) + -(20000) = -15000,
// i.e. a net £150 credit. Clamped to 0 rather than shown as negative —
// this app has no "you're in credit" UI state, so a net-refund period reads
// as "nothing spent" rather than a confusing negative £ figure. Flagged to
// the user as a choice, not a fact: happy to change this to something more
// informative later.
export function negatedSpend(rows: { amount: number }[]): number {
  const net = rows.reduce((sum, r) => sum - r.amount, 0);
  return Math.max(0, net);
}
