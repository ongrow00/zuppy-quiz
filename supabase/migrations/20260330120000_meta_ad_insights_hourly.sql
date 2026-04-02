-- Meta Ads: fatos por anúncio e fatia de tempo (ex.: hora com time_increment=1).
--
-- Deploy Edge Function: supabase functions deploy sync-meta-insights
-- Secrets: META_ACCESS_TOKEN; META_AD_ACCOUNT_IDS (lista) ou META_AD_ACCOUNT_ID;
--   META_SYNC_CRON_SECRET (opcional),
--   META_GRAPH_VERSION (default v23.0). Fuso na função: fixo America/Sao_Paulo.
-- Invocar: POST/GET .../sync-meta-insights (Bearer só se META_SYNC_CRON_SECRET definido).
--   Query opcional: ?since=YYYY-MM-DD&until=YYYY-MM-DD
-- Upsert idempotente via (account_id, ad_id, insight_date_start, insight_date_stop).

create table if not exists public.meta_ad_insights_hourly (
  id uuid primary key default gen_random_uuid(),

  account_id text not null,
  campaign_id text,
  adset_id text,
  ad_id text not null,
  object_id text,
  level text not null default 'ad',

  -- Valores brutos retornados pela Graph API (preserva hora se vier ISO)
  insight_date_start text not null,
  insight_date_stop text not null,
  -- Normalizado para consultas e agregações
  hour_start timestamptz not null,
  report_date date not null,

  ad_name text,
  adset_name text,
  campaign_name text,

  spend numeric not null default 0,
  reach numeric not null default 0,
  impressions numeric not null default 0,
  frequency numeric not null default 0,
  cpm numeric not null default 0,

  inline_link_clicks numeric not null default 0,
  unique_inline_link_clicks numeric not null default 0,
  inline_link_click_ctr numeric not null default 0,
  cost_per_unique_inline_link_click numeric not null default 0,

  landing_page_views numeric not null default 0,
  cost_per_landing_page_view numeric not null default 0,

  leads numeric not null default 0,
  cost_per_lead numeric not null default 0,

  initiate_checkout numeric not null default 0,
  cost_per_initiate_checkout numeric not null default 0,

  purchases numeric not null default 0,
  cost_per_purchase numeric not null default 0,
  purchase_value numeric not null default 0,

  roas numeric not null default 0,

  video_views numeric not null default 0,
  cost_per_video_view numeric not null default 0,
  video_p25 numeric not null default 0,
  video_p50 numeric not null default 0,
  video_p75 numeric not null default 0,
  video_p100 numeric not null default 0,
  video_15s numeric not null default 0,
  video_30s numeric not null default 0,
  video_avg_time_watched numeric not null default 0,
  video_avg_percent_watched numeric not null default 0,

  updated_at timestamptz not null default now(),

  constraint meta_ad_insights_hourly_uk unique (account_id, ad_id, insight_date_start, insight_date_stop)
);

create index if not exists meta_ad_insights_hourly_report_date_idx
  on public.meta_ad_insights_hourly (report_date desc);

create index if not exists meta_ad_insights_hourly_campaign_idx
  on public.meta_ad_insights_hourly (campaign_id, report_date desc);

create index if not exists meta_ad_insights_hourly_hour_start_idx
  on public.meta_ad_insights_hourly (hour_start desc);

comment on table public.meta_ad_insights_hourly is
  'Métricas Meta Ads (nível anúncio) por fatia de tempo; insight_date_* = strings da API; hour_start = normalização para agregação.';

alter table public.meta_ad_insights_hourly enable row level security;

-- Sem políticas: apenas service_role / bypass para ingestão; app pode ler depois com políticas explícitas.
