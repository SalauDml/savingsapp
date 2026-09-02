-- transactions has SELECT and INSERT policies but no UPDATE policy yet.
-- categorise-transactions needs to write category_id onto existing rows, which
-- is an UPDATE — without this policy, that write would silently affect 0 rows
-- under RLS (not an error, just nothing happens).
--
-- Same ownership shape as the existing INSERT policy: a transaction can only be
-- touched if it belongs to one of this user's own bank_connections.

create policy "Users can update own transactions"
  on transactions for update using (
    bank_connection_id in (
      select id from bank_connections where user_id = auth.uid()
    )
  );
