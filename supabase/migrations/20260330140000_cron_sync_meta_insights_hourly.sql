-- Agenda invocação horária no minuto 0 (hora "cheia" no relógio do servidor do Postgres).
-- No Supabase isso costuma ser UTC, não necessariamente 22:00 em São Paulo.
-- A Edge Function continua usando America/Sao_Paulo para "última hora" / "hoje".
-- Pré-requisitos:
-- 1) Dashboard → Extensions: pg_cron e pg_net habilitados (plano que suporte).
-- 2) Secrets no Vault — ver supabase/cron/sync_meta_insights_vault_setup.sql
-- 3) Edge Function deployada. META_SYNC_CRON_SECRET é opcional; se usar, crie o secret no Vault (ver cron/sync_meta_insights_vault_setup.sql).

-- Se der erro, habilite pg_cron e pg_net no Dashboard (Database → Extensions).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Remove job anterior com o mesmo nome (idempotente).
select cron.unschedule(jobid)
from cron.job
where jobname = 'sync-meta-insights-hourly';

select cron.schedule(
  'sync-meta-insights-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_meta_project_url'
        limit 1
      ) || '/functions/v1/sync-meta-insights',
      headers := jsonb_strip_nulls(
        jsonb_build_object(
          'Content-Type',
          'application/json',
          'Authorization',
          nullif(
            trim(
              (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'meta_sync_insights_authorization'
                limit 1
              )
            ),
            ''
          )
        )
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
