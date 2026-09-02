-- pg_cron: lets Postgres run jobs on a schedule.
-- pg_net: lets Postgres make outbound HTTP calls asynchronously.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'categorise-backlog-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://dbpzbzwrzwnfwaxtzyic.supabase.co/functions/v1/categorise-backlog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_b8nlFwRpikX2RX9-KQ2IVg_oQnKMEyX'
    ),
    body := '{}'::jsonb
  );
  $$
);
