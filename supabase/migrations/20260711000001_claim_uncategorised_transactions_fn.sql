create or replace function claim_uncategorised_transactions(batch_size int)
returns setof transactions as $$
begin
    return query 
    with candidates as (
        select id 
        from transactions
        where category_id is null
        and (claimed_at is null or claimed_at < now() - interval '5 minutes')
    order by created_at
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

