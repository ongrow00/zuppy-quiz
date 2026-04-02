-- Remove a agenda horária da Edge Function sync-meta-insights (menos chamadas à Meta / evita 429).
-- Para voltar a agendar no futuro, use o SQL em 20260330140000_cron_sync_meta_insights_hourly.sql
-- ou crie um novo job no Dashboard (Database → Cron) / SQL.

select cron.unschedule(jobid)
from cron.job
where jobname = 'sync-meta-insights-hourly';
