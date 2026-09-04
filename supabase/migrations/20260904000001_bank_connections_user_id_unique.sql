-- bank_connections had no unique constraint on user_id, even though every
-- read of it (fetch-transactions' .single()) assumes exactly one row per
-- user. exchange-token's plain .insert() could silently create a second row
-- on any re-connect/re-auth, which then breaks .single() with a confusing
-- "no bank connection" error despite the connection having actually just
-- succeeded. This constraint is what exchange-token's upsert (onConflict:
-- 'user_id') now relies on to replace the existing row instead of adding a
-- duplicate.
alter table bank_connections add constraint bank_connections_user_id_unique unique (user_id);
