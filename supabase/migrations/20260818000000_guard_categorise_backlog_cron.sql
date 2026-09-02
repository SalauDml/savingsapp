-- Re-schedules the same job (same name = update in place, not a duplicate).
-- Wraps the outbound call in a check so pg_net only fires — and only spends
-- OpenAI money — when there's actually a claimable backlog. Matches the same
-- "still needs work" condition as claim_uncategorised_transactions: unclaimed,
-- or claimed by a run that crashed/never finished more than 5 minutes ago.
select cron.schedule(
  'categorise-backlog-every-5-min',
  '*/5 * * * *',
  $cron$
  do $inner$
  begin
    if exists (
      select 1 from transactions
      where category_id is null
      and (claimed_at is null or claimed_at < now() - interval '5 minutes')
    ) then
      perform net.http_post(
        url := 'https://dbpzbzwrzwnfwaxtzyic.supabase.co/functions/v1/categorise-backlog',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer sb_publishable_b8nlFwRpikX2RX9-KQ2IVg_oQnKMEyX'
        ),
        body := '{}'::jsonb
      );
    end if;
  end;
  $inner$;
  $cron$
);
