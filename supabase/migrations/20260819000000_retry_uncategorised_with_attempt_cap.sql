-- Lets the backlog retry rows that already fell back to "Uncategorised", not
-- only rows where category_id is still null. Without this, any transaction
-- that ever landed on the fallback — even from an old, weaker prompt — stayed
-- permanently invisible to reprocessing, because "needs categorising" was
-- defined purely as category_id is null, and Uncategorised is a real,
-- non-null category row.

alter table transactions
  add column categorisation_attempts integer not null default 0;

-- max_attempts caps retries so genuinely ambiguous merchants (the model
-- reaches the same correct "Uncategorised" answer every time) don't get
-- re-sent to OpenAI every 5 minutes forever for zero benefit. After
-- max_attempts, a row becomes a resting state — from then on it's only
-- fixable by a human via the UI, not the automatic sweep.
create or replace function claim_uncategorised_transactions(batch_size int, max_attempts int default 2)
returns setof transactions as $$
begin
    return query
    with candidates as (
        select t.id
        from transactions t
        where (
            t.category_id is null
            or t.category_id = (select id from categories where name = 'Uncategorised' and user_id is null)
        )
        and t.categorisation_attempts < max_attempts
        and (t.claimed_at is null or t.claimed_at < now() - interval '5 minutes')
    order by t.created_at
    limit batch_size
    for update skip locked
    )
    update transactions t
    set claimed_at = now()
    from candidates c
    where t.id = c.id
    returning t.*;
end;
$$ language plpgsql;
