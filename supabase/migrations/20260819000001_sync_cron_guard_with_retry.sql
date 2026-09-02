-- The guard added in 20260818000000 checked only "category_id is null" to
-- decide whether to fire the cron. 20260819000000 widened
-- claim_uncategorised_transactions to also retry rows that already fell back
-- to Uncategorised (while categorisation_attempts < max_attempts). The guard
-- must match that same "is there real work" definition, or the cron would
-- silently stop firing once no NULL rows remain — even with a real backlog
-- of retry-eligible Uncategorised rows still waiting.
select cron.schedule(
  'categorise-backlog-every-5-min',
  '*/5 * * * *',
  $cron$
  do $inner$
  begin
    if exists (
      select 1 from transactions t
      where (
        t.category_id is null
        or t.category_id = (select id from categories where name = 'Uncategorised' and user_id is null)
      )
      and t.categorisation_attempts < 2
      and (t.claimed_at is null or t.claimed_at < now() - interval '5 minutes')
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
