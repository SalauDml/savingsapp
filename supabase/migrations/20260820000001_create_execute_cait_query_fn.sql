-- Executes an LLM-generated SELECT query for the Ask CAIT chatbot, scoped to
-- exactly what cait_reader is allowed to see (see previous migration).
--
-- SECURITY DEFINER + owned by cait_reader (not the default migration-running
-- role) is what makes this safe: the function runs with cait_reader's own
-- narrow grants, no matter which authenticated user calls it. If this were
-- left owned by the default owner (a superuser), SECURITY DEFINER would make
-- it run with FULL privileges instead — bypassing both RLS and every GRANT
-- we just wrote, for every user, not just a broader view of one user's own
-- data. The ALTER FUNCTION ... OWNER TO line below is not optional.
create or replace function execute_cait_query (query text)
returns setof jsonb
language plpgsql
-- Runs with the function OWNER's privileges (cait_reader), not the caller's
-- — the whole point, so every user goes through the same narrow role.
security definer
-- Pins name resolution to the public schema regardless of the caller's own
-- search_path — a standard hardening step for SECURITY DEFINER functions.
set search_path = public
as $$
declare
  cleaned_query text;
begin
  -- Strip trailing whitespace and any trailing semicolon(s) — LLMs
  -- habitually end SQL with one, and a semicolon left inside the subquery
  -- below would be a syntax error, not a security hole, but no reason to
  -- fail on something this predictable.
  cleaned_query := regexp_replace(trim(query), ';+\s*$', '');

  if cleaned_query !~* '^select\s' then
    raise exception 'Only SELECT queries are allowed';
  end if;

  -- Bound how long a single query can run — without this, a generated query
  -- calling pg_sleep() or doing an expensive cross join hangs the
  -- connection instead of just failing.
  set local statement_timeout = '3000ms';

  -- Wrapping the caller's SQL as a subquery, rather than running it
  -- directly, does two things at once: to_jsonb(t) gives one generic return
  -- shape no matter what columns the LLM selected, AND it makes
  -- stacked-statement injection (`SELECT 1; DROP TABLE x`) a plain SQL
  -- syntax error — a subquery's parentheses can only ever hold one
  -- statement, so there's no place for a second one to go.
  return query execute format('select to_jsonb(t) from (%s) t', cleaned_query);
end;
$$;

-- Role membership (not a privilege grant) — lets whatever role runs this
-- migration "become" cait_reader, which ALTER FUNCTION ... OWNER TO needs
-- unless the caller is a true superuser. cait_reader was created in the
-- previous migration but nothing was ever granted membership in it.
grant cait_reader to postgres;

-- Postgres also requires the *new* owner to hold CREATE on the function's
-- schema before an ownership transfer is allowed — not because cait_reader
-- should ever create anything (it never will: the function only ever runs
-- a SELECT), just to complete the ALTER. Grant it only for this statement,
-- then take it straight back so cait_reader's standing privileges stay
-- exactly select-only, same as everywhere else in this feature.
grant create on schema public to cait_reader;
alter function execute_cait_query(text) owner to cait_reader;
revoke create on schema public from cait_reader;

-- Functions are callable by everyone by default. Restrict it to logged-in
-- app users — not because it grants anything extra (cait_reader's grants +
-- RLS already bound what it can return either way), but so an anonymous,
-- unauthenticated request can't invoke it at all.
revoke execute on function execute_cait_query(text) from public;
grant execute on function execute_cait_query(text) to authenticated;
