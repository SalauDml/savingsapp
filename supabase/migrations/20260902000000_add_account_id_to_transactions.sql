-- Diagnosing a bug where every transaction this month showed up 5x in sums:
-- the transactions table has no column recording which TrueLayer *account* a
-- row came from, even though fetch-transactions loops over every account on
-- the connection and writes all of their transactions into the same
-- bank_connection_id bucket. The existing unique constraint —
-- (bank_connection_id, truelayer_transaction_id) — can't protect against
-- that: TrueLayer transaction ids are scoped per-account, so five accounts
-- returning look-alike fixture data each get their own legitimately-unique
-- id, and all five sail past the constraint as "different" rows.
--
-- account_id is nullable because existing rows were written before this
-- column existed and won't be backfilled here — the 5x duplicate data
-- already in the table needs its own cleanup pass once we've confirmed
-- (from freshly-synced rows that DO have account_id set) whether this is
-- really 5 distinct sandbox accounts or 1 account whose id got repeated in
-- the accounts list before the loop ran.
alter table transactions add column account_id text;

-- Replaces the old two-column unique constraint with the three-column one
-- fetch-transactions now upserts against. Widening it (not narrowing) is
-- what makes this safe to run before we know the diagnosis: it can only
-- allow rows through that the old constraint would already have allowed,
-- never fewer.
alter table transactions drop constraint transactions_bank_connection_truelayer_id_unique;
alter table transactions add constraint transactions_bank_connection_account_truelayer_id_unique
  unique (bank_connection_id, account_id, truelayer_transaction_id);
