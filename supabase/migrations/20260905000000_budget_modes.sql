-- Which mode is active, and category mode's one shared period. Both live on
-- profiles because they're facts about the user, not about either budget
-- table — a table-level flag would need to be kept in sync with which
-- table is "live," which is the exact denormalization this avoids.
alter table profiles
  add column active_budget_mode text not null default 'overall'
    check (active_budget_mode in ('overall', 'category'));

alter table profiles
  add column category_budget_period text not null default 'weekly'
    check (category_budget_period in ('weekly', 'monthly'));

-- Overall mode's one number. Separate table per the user's decision to keep
-- overall and per-category budgets apart rather than a nullable category_id
-- on one table. One row per user (unique below) — set via
-- upsert(onConflict: 'user_id'), same "exactly one row per user" shape as
-- bank_connections (20260904000001).
create table overall_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  period text not null default 'weekly'
    check (period in ('weekly', 'monthly')),
  created_at timestamptz not null default now(),
  constraint overall_budgets_user_unique unique (user_id)
);

alter table overall_budgets enable row level security;

create policy "Users can view own overall budget"
  on overall_budgets for select using (user_id = auth.uid());
create policy "Users can insert own overall budget"
  on overall_budgets for insert with check (user_id = auth.uid());
create policy "Users can update own overall budget"
  on overall_budgets for update using (user_id = auth.uid());
create policy "Users can delete own overall budget"
  on overall_budgets for delete using (user_id = auth.uid());

-- Fix budgets: no uniqueness has ever existed on this table, so a duplicate
-- insert for the same category would silently double-count in any SUM.
-- Zero rows have ever been written to this table, so this is safe with no
-- cleanup step.
alter table budgets
  add constraint budgets_user_category_unique unique (user_id, category_id);

-- Drop the free-text, unconstrained period column — its only real meaning
-- was "shared across every row for this user," which is now represented
-- once, correctly, on profiles.category_budget_period instead of N times
-- with nothing keeping them equal.
alter table budgets drop column period;

-- Same narrow SELECT-only grant cait_reader already has on budgets. No
-- column-level grant needed — this table's RLS policy has no subquery into
-- another table, same shape as budgets' own policy, which already works
-- this way under cait_reader.
grant select on overall_budgets to cait_reader;
