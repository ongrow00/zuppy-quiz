-- Consultas filtrando por conta (várias contas na mesma tabela).
create index if not exists meta_ad_insights_hourly_account_id_idx
  on public.meta_ad_insights_hourly (account_id, report_date desc);
