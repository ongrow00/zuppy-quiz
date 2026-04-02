/**
 * Espelha a lógica do mapOne (n8n) para Insights no nível de anúncio.
 */
export type InsightRow = Record<string, unknown>;

const REPORT_TZ = "America/Sao_Paulo";

function num(x: unknown): number | null {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function pick(
  arr: unknown,
  wanted: string | null,
  opts: { by?: string; agg?: "first" | "max" | "sum" } = {},
): number | null {
  const by = opts.by ?? "action_type";
  const agg = opts.agg ?? "first";
  if (!Array.isArray(arr) || !arr.length) return null;
  const norm = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : v);
  if (wanted) {
    const found = arr.find((x) => {
      const o = x as Record<string, unknown>;
      return norm(o[by]) === norm(wanted);
    });
    return found ? num((found as Record<string, unknown>).value) : null;
  }
  const vals = arr
    .map((x) => num((x as Record<string, unknown>).value))
    .filter((v): v is number => v !== null);
  if (!vals.length) return null;
  if (agg === "max") return Math.max(...vals);
  if (agg === "sum") return vals.reduce((a, b) => a + b, 0);
  return vals[0];
}

function lpvFromActions(actions: unknown): number | null {
  return pick(actions, "landing_page_view") ?? pick(actions, "omni_landing_page_view");
}

function costPerLPV(costs: unknown): number | null {
  return pick(costs, "landing_page_view") ?? pick(costs, "omni_landing_page_view");
}

function roasFromArray(purchase_roas: unknown): number | null {
  return pick(purchase_roas, "omni_purchase", { by: "action_type" }) ??
    pick(purchase_roas, null, { agg: "max" });
}

function videoViewsFromActions(actions: unknown): number | null {
  return pick(actions, "video_view");
}

function costPerVideoView(costs: unknown): number | null {
  return pick(costs, "video_view");
}

function pickVideoDepth(r: InsightRow, field: string): number | null {
  return pick(r[field], "video_view");
}

/**
 * Retorna YYYY-MM-DD no fuso America/Sao_Paulo (UTC-3).
 * Quando dateStart contém hora (ex.: hourly_start_time), a data é derivada no fuso correto;
 * caso contrário (só YYYY-MM-DD) retorna a data como está.
 */
export function reportDateFromInsightDateStart(dateStart: string): string {
  const s = dateStart.trim();
  // Só data — retorna direto, sem conversão de fuso (já é a data local do anunciante)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Tem hora — converte para o fuso de SP para obter a data correta
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: REPORT_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(t));
  }
  throw new Error(`reportDateFromInsightDateStart: invalid date_start: ${dateStart}`);
}

/**
 * Normaliza o início da fatia para timestamptz ISO.
 * Se a API mandar só data, usa 00:00:00 UTC (fallback).
 */
export function hourStartFromInsight(r: InsightRow): string {
  // Quando usamos breakdown horário, vem hourly_start_time (ex.: 2023-10-27T01:00:00+0000)
  const hst = r.hourly_start_time;
  if (typeof hst === "string" && hst.trim()) {
    // Meta costuma usar +0000 sem ":"; Date.parse não entende sempre.
    const s = hst.trim().replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }

  // Alternativa comum: campo "hourly_stats_aggregated_by_advertiser_time_zone"
  // vem como "HH:MM:SS - HH:MM:SS" (sem data). Combinamos com date_start.
  const hourly = r.hourly_stats_aggregated_by_advertiser_time_zone;
  if (typeof hourly === "string" && hourly.trim()) {
    const m = hourly.trim().match(/^(\d{2}):(\d{2}):(\d{2})\s*-/);
    if (m) {
      const ds = String(r.date_start ?? "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
        // Construímos um ISO no fuso de São Paulo e convertemos para UTC.
        // Obs: Brasil hoje não tem DST; ainda assim mantemos o TZ para consistência.
        const isoLocal = `${ds}T${m[1]}:${m[2]}:${m[3]}`;
        const t = Date.parse(`${isoLocal}-03:00`);
        if (!Number.isNaN(t)) return new Date(t).toISOString();
      }
    }
  }

  const ds = String(r.date_start ?? "");
  if (ds.length > 10) {
    const t = Date.parse(ds);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  const base = ds.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) {
    return `${base}T00:00:00.000Z`;
  }
  const dst = String(r.date_stop ?? "");
  if (dst.length > 10) {
    const t2 = Date.parse(dst);
    if (!Number.isNaN(t2)) return new Date(t2).toISOString();
  }
  throw new Error(`hourStartFromInsight: cannot parse date_start/date_stop: ${ds} / ${dst}`);
}

export function mapInsightToRow(r: InsightRow): Record<string, unknown> {
  const spend = num(r.spend) ?? 0;

  const inline_link_clicks = num(r.inline_link_clicks) ?? 0;
  const unique_inline_link_clicks = num(r.unique_inline_link_clicks) ?? 0;
  const inline_link_click_ctr = num(r.inline_link_click_ctr);

  const lpv = lpvFromActions(r.actions);
  const cplpv = costPerLPV(r.cost_per_action_type);

  const leads = pick(r.actions, "lead") ?? pick(r.actions, "onsite_web_lead");
  const cost_per_lead = pick(r.cost_per_action_type, "lead") ??
    pick(r.cost_per_action_type, "onsite_web_lead");

  const initiate_checkout = pick(r.actions, "initiate_checkout") ??
    pick(r.actions, "omni_initiated_checkout");
  const cost_per_initiate_checkout =
    pick(r.cost_per_action_type, "initiate_checkout") ??
      pick(r.cost_per_action_type, "omni_initiated_checkout");

  const purchases = pick(r.actions, "purchase") ?? pick(r.actions, "omni_purchase");
  const cost_per_purchase = pick(r.cost_per_action_type, "purchase") ??
    pick(r.cost_per_action_type, "omni_purchase");
  const purchase_value = pick(r.action_values, "purchase") ??
    pick(r.action_values, "omni_purchase");

  const roas_field = roasFromArray(r.purchase_roas);
  const roas_calc = purchase_value && spend ? purchase_value / spend : null;
  const roas = roas_field ?? roas_calc;

  const cost_per_unique_inline_link_click = unique_inline_link_clicks
    ? spend / unique_inline_link_clicks
    : null;

  const video_views = videoViewsFromActions(r.actions) ?? 0;
  const cost_per_video_view = costPerVideoView(r.cost_per_action_type);

  const video_p25 = pickVideoDepth(r, "video_p25_watched_actions") ?? 0;
  const video_p50 = pickVideoDepth(r, "video_p50_watched_actions") ?? 0;
  const video_p75 = pickVideoDepth(r, "video_p75_watched_actions") ?? 0;
  const video_p100 = pickVideoDepth(r, "video_p100_watched_actions") ?? 0;

  const video_15s = pickVideoDepth(r, "video_15_sec_watched_actions") ?? 0;
  const video_30s = pickVideoDepth(r, "video_30_sec_watched_actions") ?? 0;

  const video_avg_time_watched = pickVideoDepth(r, "video_avg_time_watched_actions");
  const video_avg_percent_watched = pickVideoDepth(r, "video_avg_percent_watched_actions");

  // Se tiver hourly_start_time, usamos ele como referência de fatia
  const insight_date_start = String(r.hourly_start_time ?? r.date_start ?? "");
  const insight_date_stop = String(r.date_stop ?? "");
  const hour_start = hourStartFromInsight(r);
  const report_date = reportDateFromInsightDateStart(insight_date_start);

  const o: Record<string, unknown> = {
    account_id: r.account_id ?? null,
    campaign_id: r.campaign_id ?? null,
    adset_id: r.adset_id ?? null,
    ad_id: r.ad_id ?? null,
    object_id: r.ad_id ?? null,
    level: "ad",

    insight_date_start,
    insight_date_stop,
    hour_start,
    report_date,

    ad_name: r.ad_name ?? null,
    adset_name: r.adset_name ?? null,
    campaign_name: r.campaign_name ?? null,

    spend,
    reach: num(r.reach) ?? 0,
    impressions: num(r.impressions) ?? 0,
    frequency: num(r.frequency),
    cpm: num(r.cpm),

    inline_link_clicks,
    unique_inline_link_clicks,
    inline_link_click_ctr,
    cost_per_unique_inline_link_click,

    landing_page_views: lpv ?? 0,
    cost_per_landing_page_view: cplpv,

    leads: leads ?? 0,
    cost_per_lead,
    initiate_checkout: initiate_checkout ?? 0,
    cost_per_initiate_checkout,
    purchases: purchases ?? 0,
    cost_per_purchase,
    purchase_value: purchase_value ?? 0,

    roas,

    video_views,
    cost_per_video_view,
    video_p25,
    video_p50,
    video_p75,
    video_p100,
    video_15s,
    video_30s,
    video_avg_time_watched,
    video_avg_percent_watched,
  };

  const numericKeys = [
    "spend",
    "reach",
    "impressions",
    "frequency",
    "cpm",
    "inline_link_clicks",
    "unique_inline_link_clicks",
    "inline_link_click_ctr",
    "cost_per_unique_inline_link_click",
    "landing_page_views",
    "cost_per_landing_page_view",
    "leads",
    "cost_per_lead",
    "initiate_checkout",
    "cost_per_initiate_checkout",
    "purchases",
    "cost_per_purchase",
    "purchase_value",
    "roas",
    "video_views",
    "cost_per_video_view",
    "video_p25",
    "video_p50",
    "video_p75",
    "video_p100",
    "video_15s",
    "video_30s",
    "video_avg_time_watched",
    "video_avg_percent_watched",
  ];

  for (const k of numericKeys) {
    const v = o[k];
    if (v === null || v === undefined || Number.isNaN(v)) o[k] = 0;
    else o[k] = Number(v);
  }

  return o;
}
