-- A dedicated, narrow-privilege role for the Ask CAIT text-to-SQL feature.
-- NOLOGIN: nothing ever connects to Postgres *as* this role directly — it's
-- only ever assumed by the execute_cait_query() function (next migration),
-- via SECURITY DEFINER. It exists purely as a container of grants.
create role cait_reader nologin;

grant usage on schema public to cait_reader;

-- Only these three tables, only SELECT. No bank_connections, no profiles —
-- if the feature doesn't need a table to answer spending questions, this
-- role has no way to read it, no matter what SQL the LLM writes.
--
-- RLS still applies underneath this: this grant answers "can this role
-- touch the table at all," the existing RLS policies answer "which rows."
-- Both have to say yes before a row comes back.
grant select on transactions, categories, budgets to cait_reader;
