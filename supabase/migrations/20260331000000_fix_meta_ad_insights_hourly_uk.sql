-- Corrige a unique constraint da tabela meta_ad_insights_hourly.
--
-- Problema: a constraint antiga usava (account_id, ad_id, insight_date_start, insight_date_stop).
-- A API do Facebook com breakdown horário não retorna hourly_start_time; retorna apenas date_start
-- (YYYY-MM-DD) + hourly_stats_aggregated_by_advertiser_time_zone ("HH:MM:SS - HH:MM:SS").
-- Portanto insight_date_start ficava como "YYYY-MM-DD" (sem hora), tornando a chave idêntica
-- para todas as horas do mesmo dia → cada cron sobrescrevia o registro anterior.
--
-- Solução: usar hour_start (timestamptz, calculado corretamente com a hora) como discriminador.

-- 1. Remove constraint antiga
alter table public.meta_ad_insights_hourly
  drop constraint if exists meta_ad_insights_hourly_uk;

-- 2. Cria constraint correta: única por conta + anúncio + hora
alter table public.meta_ad_insights_hourly
  add constraint meta_ad_insights_hourly_uk
  unique (account_id, ad_id, hour_start);
