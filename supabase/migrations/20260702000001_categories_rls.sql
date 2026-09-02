-- categories has had no RLS since Phase 1 — close that gap here.
--
-- Rules to encode:
--   SELECT: a user can see global categories (user_id is null) OR their own (user_id = auth.uid())
--   INSERT: a user can only insert a row that is owned by themselves (user_id = auth.uid())
--           — this is what stops a student from creating a "global" category for everyone
--   UPDATE: a user can only update their own rows
--           — because NULL = auth.uid() is never true, this automatically protects
--             the global (NULL-owned) rows too, with no extra condition needed
--   DELETE: a user can only delete their own rows
--
-- Reference: the `budgets` policies just above in the initial schema migration
-- follow this exact ownership shape already.

alter table categories enable row level security;

-- TODO: write the four policies (select, insert, update, delete) described above.

create policy "Users can view global categories and categories they create "
    on categories for select using(user_id = auth.uid() or user_id is null);

create policy "Users can create own categories"
    on categories for insert with check(user_id = auth.uid());

create policy "Users can update own categories"
    on categories for update using (user_id=auth.uid());

create policy "Users can delete own categories"
    on categories for delete using (user_id= auth.uid());


