-- Money movement.
--
-- Until now every category was a *spending* category, so ~73% of transactions
-- fell back to 'Uncategorised' — not because the model failed, but because the
-- correct answer didn't exist. Money sent to a person, benefits arriving, an
-- ATM withdrawal and a savings round-up had nowhere to go.
--
-- `kind` lives on categories rather than on transactions because it's fixed by
-- what a category IS: 'Groceries' is always spending, 'Income' is always
-- income. That means the LLM makes ONE decision (pick a category) and the
-- direction of the money comes free from a join — a transaction can never
-- contradict its own category.
--
-- A check constraint rather than a Postgres enum type: the set is small and
-- fixed, and a constraint is far easier to change later (drop/add constraint)
-- than an enum (which needs ALTER TYPE and can't drop values at all).
alter table categories
  add column kind text not null default 'spending'
    check (kind in ('spending', 'income', 'transfer'));

-- `not null default 'spending'` backfills the eight existing categories in
-- place — all of them (including 'Uncategorised') are spending categories, so
-- the default is already correct and no explicit update is needed.

-- The four new global categories. user_id is null = visible to every student.
-- 'Uncategorised' stays kind='spending' so an unknown row never inflates income.
insert into categories (name, user_id, kind) values
  ('Fees & Charges', null, 'spending'),  -- overdraft fees, returned direct debits
  ('Income',         null, 'income'),    -- wages, student loan, benefits, refunds, gifts
  ('Transfers',      null, 'transfer'),  -- money to/from people, savings round-ups
  ('Cash',           null, 'transfer');  -- ATM withdrawals: left the account, not yet spent

-- Spending screens must now filter on kind, e.g.
--   select sum(t.amount) from transactions t
--   join categories c on c.id = t.category_id
--   where c.kind = 'spending';
-- Without that filter a student's "spent this month" would include their
-- student loan arriving.
