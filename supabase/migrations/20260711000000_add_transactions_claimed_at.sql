alter table transactions
    add column claimed_at timestamptz;

create index transactions_unclaimed_idx
    on transactions (claimed_at)
    where category_id is null;

