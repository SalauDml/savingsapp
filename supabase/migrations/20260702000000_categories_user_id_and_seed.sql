-- Add ownership to categories.
-- NULL user_id = a global default category (visible to everyone, read-only to students)
-- a real uuid  = a category a specific student created for themselves
alter table categories add column user_id uuid references profiles(id) on delete cascade;

-- Seed the default categories every student starts with.
-- "Uncategorised" is a real row (not a NULL category_id) so the LLM always has
-- a valid fallback id to assign, and every later query can assume category_id is set.
insert into categories (name, user_id) values
  ('Groceries', null),
  ('Eating Out', null),
  ('Transport', null),
  ('Bills & Subscriptions', null),
  ('Entertainment', null),
  ('Shopping', null),
  ('Health', null),
  ('Uncategorised', null);
