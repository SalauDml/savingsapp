export type BudgetPeriod = 'weekly' | 'monthly';

// Matches Postgres's date_trunc('week', ...) (ISO week, Monday start) and
// date_trunc('month', ...) exactly, so this app's own displays and Ask
// CAIT's SQL-generated answers never disagree about which transactions
// count as "this week" or "this month". Shared rather than copy-pasted
// per-screen on purpose — this project already had a prompt drift apart
// once from being duplicated across categorise-transactions and
// categorise-backlog (see PLAN.md Phase 5).
export function periodStart(period: BudgetPeriod): string {
  const now = new Date();
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  const day = now.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
