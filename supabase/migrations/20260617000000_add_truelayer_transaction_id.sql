alter table transactions
    add column truelayer_transaction_id text;

alter table transactions
    add constraint transactions_bank_connection_truelayer_id_unique
    unique(bank_connection_id, truelayer_transaction_id )    