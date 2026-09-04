-- transactions.truelayer_transaction_id (and its unique constraint) were
-- named after TrueLayer, but the app now writes Monzo transaction ids into
-- this column (see the exchange-token/fetch-transactions Monzo pivot in
-- PLAN.md Phase 3). Pure rename - no data changes, no behaviour changes.
-- Both RENAME COLUMN and RENAME CONSTRAINT are metadata-only operations in
-- Postgres (no table rewrite, no lock beyond a brief ACCESS EXCLUSIVE to
-- update the catalog), safe to run against a live table.
alter table transactions rename column truelayer_transaction_id to provider_transaction_id;

alter table transactions rename constraint transactions_bank_connection_account_truelayer_id_unique
  to transactions_bank_connection_account_provider_id_unique;
