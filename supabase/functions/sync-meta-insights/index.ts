import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { DateTime } from "https://esm.sh/luxon@3.5.0";
import { mapInsightToRow, type InsightRow } from "../_shared/meta-map.ts";

type InsightsWindowMode = "last_hour" | "today";

const GRAPH_FIELDS = [
  "date_start",
  "date_stop",
  "ad_name",
  "adset_name",
  "campaign_name",
  "account_id",
  "ad_id",
  "adset_id",
  "campaign_id",
  "spend",
  "reach",
  "impressions",
  "frequency",
  "cpm",
  "inline_link_clicks",
  "unique_inline_link_clicks",
  "inline_link_click_ctr",
  "actions",
  "cost_per_action_type",
  "action_values",
  "purchase_roas",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p100_watched_actions",
  "video_15_sec_watched_actions",
  "video_30_sec_watched_actions",
  // video_avg_*_actions não são válidos em fields do Insights (API retorna #100).
].join(",");

function env(name: string): string | undefined {
  return Deno.env.get(name)?.trim();
}

function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Várias contas: META_AD_ACCOUNT_IDS="111,222,333" (vírgula ou quebra de linha).
 * Uma conta: META_AD_ACCOUNT_ID=111 (compatível com o fluxo antigo).
 */
function resolveAdAccountIds(): string[] {
  const multi = env("META_AD_ACCOUNT_IDS");
  if (multi) {
    const ids = multi
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^act_/i, ""));
    if (ids.length) return ids;
  }
  const single = env("META_AD_ACCOUNT_ID");
  if (single) {
    return [single.replace(/^act_/i, "")];
  }
  throw new Error(
    "Missing ad accounts: set META_AD_ACCOUNT_IDS (comma-separated) or META_AD_ACCOUNT_ID",
  );
}

/** Hoje no calendário do fuso (YYYY-MM-DD). */
function todayRangeInTz(tz: string): { since: string; until: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const day = `${y}-${m}-${d}`;
  return { since: day, until: day };
}

/**
 * Última hora civil completa no fuso (ex.: às 15:37 → intervalo [14:00, 15:00) em tz).
 * Retorna time_range mínimo para a API e limites UTC em ms para filtrar linhas.
 */
function lastCompletedHourInTz(tz: string): {
  since: string;
  until: string;
  startUtcMs: number;
  endUtcMsExclusive: number;
  hourStartIso: string;
  hourEndIso: string;
} {
  const now = DateTime.now().setZone(tz);
  const endExclusive = now.startOf("hour");
  const startInclusive = endExclusive.minus({ hours: 1 });
  const startUtcMs = startInclusive.toUTC().toMillis();
  const endUtcMsExclusive = endExclusive.toUTC().toMillis();

  const d1 = startInclusive.toFormat("yyyy-MM-dd");
  const d2 = endExclusive.minus({ milliseconds: 1 }).toFormat("yyyy-MM-dd");
  const since = d1 < d2 ? d1 : d2;
  const until = d1 > d2 ? d1 : d2;

  return {
    since,
    until,
    startUtcMs,
    endUtcMsExclusive,
    hourStartIso: startInclusive.toUTC().toISO() ?? "",
    hourEndIso: endExclusive.toUTC().toISO() ?? "",
  };
}

function rowHourStartMs(row: Record<string, unknown>): number | null {
  const hs = row.hour_start;
  if (typeof hs !== "string") return null;
  const t = Date.parse(hs);
  return Number.isNaN(t) ? null : t;
}

function rowInLastHourWindow(
  row: Record<string, unknown>,
  startUtcMs: number,
  endUtcMsExclusive: number,
): boolean {
  const t = rowHourStartMs(row);
  if (t === null) return false;
  return t >= startUtcMs && t < endUtcMsExclusive;
}

/** Campos para polling do Ad Report Run (Marketing API async insights). */
const REPORT_RUN_POLL_FIELDS = [
  "async_status",
  "async_percent_completion",
  "error_code",
  "error_message",
  "error_subcode",
  "error_user_title",
  "error_user_msg",
].join(",");

function isAsyncReportRunPayload(j: Record<string, unknown>): boolean {
  if (Array.isArray(j.data)) return false;
  if (typeof j.async_status === "string") return true;
  if (j.is_running === true) return true;
  if (j.report_run_id != null) return true;
  return false;
}

function extractReportRunId(j: Record<string, unknown>): string | null {
  const rr = j.report_run_id;
  if (rr != null && String(rr).length > 0) return String(rr);
  const id = j.id;
  if (id != null && String(id).length > 0) return String(id);
  return null;
}

function reportRunInsightsUrl(
  graphVersion: string,
  reportRunId: string,
  queryString: string,
): string {
  return `https://graph.facebook.com/${graphVersion}/${reportRunId}/insights?${queryString}`;
}

/**
 * Poll até Job Completed (ou falha). Ver:
 * https://developers.facebook.com/docs/marketing-api/insights/best-practices
 */
async function pollReportRunUntilDone(
  graphVersion: string,
  reportRunId: string,
  accessToken: string,
): Promise<void> {
  const maxWait = Number(env("META_INSIGHTS_ASYNC_MAX_WAIT_MS") ?? "") || 120_000;
  const pollMs = Number(env("META_INSIGHTS_ASYNC_POLL_MS") ?? "") || 2_000;
  const deadline = Date.now() + maxWait;
  let lastLogAt = 0;

  while (Date.now() < deadline) {
    const statusUrl =
      `https://graph.facebook.com/${graphVersion}/${reportRunId}?fields=${encodeURIComponent(REPORT_RUN_POLL_FIELDS)}`;
    const res = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const j = (await res.json()) as Record<string, unknown> & {
      error?: { message: string };
    };
    if (!res.ok || j.error) {
      throw new Error(
        `Graph API error (report run ${reportRunId}): ${res.status} ${JSON.stringify(j.error ?? j)}`,
      );
    }

    const status = String(j.async_status ?? "");
    const pct = Number(j.async_percent_completion ?? 0);
    const now = Date.now();
    if (now - lastLogAt >= 10_000 || status === "Job Completed" || status === "Job Failed") {
      console.log(
        `[sync-meta-insights] Job ${reportRunId}: ${status} (${pct}%) — raw: ${JSON.stringify(j)}`,
      );
      lastLogAt = now;
    }

    if (status === "Job Completed") return;
    if (status === "Job Failed" || status === "Job Skipped") {
      const detail = [
        j.error_message,
        j.error_user_msg,
        j.error_user_title,
        j.error_code != null ? `code=${j.error_code}` : "",
        j.error_subcode != null ? `subcode=${j.error_subcode}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      throw new Error(
        `Meta insights job ${reportRunId} ${status}: ${detail || JSON.stringify(j)}`,
      );
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }

  throw new Error(
    `Meta insights job ${reportRunId} timed out after ${maxWait}ms. Increase META_INSIGHTS_ASYNC_MAX_WAIT_MS (e confira o limite de duração da Edge Function).`,
  );
}

/**
 * Pagina insights. Se a Meta devolver um Ad Report Run (async), faz poll e lê `/{id}/insights`.
 */
async function fetchAllInsightsPages(
  firstUrl: string,
  accessToken: string,
  graphVersion: string,
): Promise<InsightRow[]> {
  const out: InsightRow[] = [];
  let url: string | null = firstUrl;
  const queryString = new URL(firstUrl).search.slice(1);
  let asyncDepth = 0;
  const maxAsyncDepth = 3;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = (await res.json()) as Record<string, unknown> & {
      data?: InsightRow[];
      error?: { message: string };
      paging?: { next?: string };
    };

    if (!res.ok || json.error) {
      throw new Error(
        `Graph API error: ${res.status} ${JSON.stringify(json.error ?? json)}`,
      );
    }

    if (!Array.isArray(json.data) && isAsyncReportRunPayload(json)) {
      asyncDepth += 1;
      if (asyncDepth > maxAsyncDepth) {
        throw new Error("Meta insights: excesso de redirecionamentos async (report runs aninhados)");
      }
      const jobId = extractReportRunId(json);
      if (!jobId) {
        throw new Error(`Async insights sem id de job: ${JSON.stringify(json)}`);
      }
      console.log(
        `[sync-meta-insights] Job ${jobId}: ${String(json.async_status ?? "?")} (${String(json.async_percent_completion ?? 0)}%) — raw: ${JSON.stringify(json)}`,
      );
      await pollReportRunUntilDone(graphVersion, jobId, accessToken);
      url = reportRunInsightsUrl(graphVersion, jobId, queryString);
      continue;
    }

    if (Array.isArray(json.data)) {
      for (const row of json.data) out.push(row);
    }
    url = json.paging?.next ?? null;
  }
  return out;
}

function buildInsightsUrl(
  graphVersion: string,
  adAccountId: string,
  since: string,
  until: string,
): string {
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const timeRange = JSON.stringify({ since, until });
  const q = [
    `fields=${encodeURIComponent(GRAPH_FIELDS)}`,
    "level=ad",
    "time_increment=1",
    "limit=5000",
    // Breakdown horário oficial (hora no fuso do anunciante)
    "breakdowns=hourly_stats_aggregated_by_advertiser_time_zone",
    "action_breakdowns=action_type",
    `time_range=${encodeURIComponent(timeRange)}`,
  ].join("&");
  return `https://graph.facebook.com/${graphVersion}/${id}/insights?${q}`;
}

async function upsertChunks(
  supabase: ReturnType<typeof createClient>,
  rows: Record<string, unknown>[],
  chunkSize: number,
): Promise<{ error: string | null }> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("meta_ad_insights_hourly").upsert(chunk, {
      onConflict: "account_id,ad_id,hour_start",
    });
    if (error) return { error: error.message };
  }
  return { error: null };
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const cronSecret = env("META_SYNC_CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const accessToken = requireEnv("META_ACCESS_TOKEN");
    const adAccountIds = resolveAdAccountIds();
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const graphVersion = env("META_GRAPH_VERSION") ?? "v23.0";
    /** Fuso fixo: corte de “hoje” e “última hora” sempre no horário de São Paulo. */
    const reportTz = "America/Sao_Paulo";

    const envWindow = env("META_INSIGHTS_WINDOW")?.toLowerCase();
    let modeFromEnv: InsightsWindowMode = envWindow === "today"
      ? "today"
      : "last_hour";

    let since: string;
    let until: string;
    let usedExplicitSinceUntil = false;
    /** Só preenchido em last_hour: filtra linhas pela hora normalizada (UTC ms). */
    let hourFilter: {
      startUtcMs: number;
      endUtcMsExclusive: number;
    } | null = null;
    let hourWindowMeta: {
      hour_start_utc: string;
      hour_end_utc_exclusive: string;
    } | null = null;

    if (req.method === "POST") {
      const raw = await req.text();
      let usedBody = false;
      let bodyWindow: InsightsWindowMode | null = null;
      if (raw.trim()) {
        try {
          const body = JSON.parse(raw) as {
            since?: string;
            until?: string;
            date_start?: string;
            date_end?: string;
            window?: string;
          };
          const w = body.window?.toLowerCase();
          if (w === "today") bodyWindow = "today";
          else if (w === "last_hour") bodyWindow = "last_hour";

          const ds = (body.since ?? body.date_start)?.trim() ?? "";
          const de = (body.until ?? body.date_end)?.trim() ?? "";
          if ((ds && !de) || (!ds && de)) {
            return jsonError(
              400,
              "date_start e date_end são obrigatórios juntos (YYYY-MM-DD). Aliases no body: since e until.",
            );
          }
          if (ds && de) {
            if (!YMD_RE.test(ds) || !YMD_RE.test(de)) {
              return jsonError(
                400,
                "date_start e date_end devem estar no formato YYYY-MM-DD (aliases: since, until).",
              );
            }
            since = ds;
            until = de;
            usedBody = true;
            usedExplicitSinceUntil = true;
          }
        } catch {
          // ignore invalid JSON
        }
      }
      if (!usedBody) {
        const mode = bodyWindow ?? modeFromEnv;
        if (mode === "today") {
          const r = todayRangeInTz(reportTz);
          since = r.since;
          until = r.until;
        } else {
          const h = lastCompletedHourInTz(reportTz);
          since = h.since;
          until = h.until;
          hourFilter = {
            startUtcMs: h.startUtcMs,
            endUtcMsExclusive: h.endUtcMsExclusive,
          };
          hourWindowMeta = {
            hour_start_utc: h.hourStartIso,
            hour_end_utc_exclusive: h.hourEndIso,
          };
        }
      }
    } else {
      const url = new URL(req.url);
      const qs =
        (url.searchParams.get("since") ?? url.searchParams.get("date_start"))?.trim() ?? "";
      const qu =
        (url.searchParams.get("until") ?? url.searchParams.get("date_end"))?.trim() ?? "";
      const qpWindow = url.searchParams.get("window")?.toLowerCase();
      let queryMode: InsightsWindowMode | null = null;
      if (qpWindow === "today") queryMode = "today";
      if (qpWindow === "last_hour") queryMode = "last_hour";

      if ((qs && !qu) || (!qs && qu)) {
        return jsonError(
          400,
          "date_start e date_end são obrigatórios juntos na query (YYYY-MM-DD). Aliases: since e until.",
        );
      }
      if (qs && qu) {
        if (!YMD_RE.test(qs) || !YMD_RE.test(qu)) {
          return jsonError(
            400,
            "date_start e date_end devem estar no formato YYYY-MM-DD (aliases: since, until).",
          );
        }
        since = qs;
        until = qu;
        usedExplicitSinceUntil = true;
      } else {
        const mode = queryMode ?? modeFromEnv;
        if (mode === "today") {
          const r = todayRangeInTz(reportTz);
          since = r.since;
          until = r.until;
        } else {
          const h = lastCompletedHourInTz(reportTz);
          since = h.since;
          until = h.until;
          hourFilter = {
            startUtcMs: h.startUtcMs,
            endUtcMsExclusive: h.endUtcMsExclusive,
          };
          hourWindowMeta = {
            hour_start_utc: h.hourStartIso,
            hour_end_utc_exclusive: h.hourEndIso,
          };
        }
      }
    }

    const mapped: Record<string, unknown>[] = [];
    const perAccount: { account_id: string; fetched: number; kept: number }[] = [];

    for (const adAccountId of adAccountIds) {
      const insightsUrl = buildInsightsUrl(graphVersion, adAccountId, since, until);
      const rawRows = await fetchAllInsightsPages(
        insightsUrl,
        accessToken,
        graphVersion,
      );

      let kept = 0;
      const fetched = rawRows.length;
      for (const r of rawRows) {
        if (!r.ad_id) continue;
        const row = mapInsightToRow(r as InsightRow);
        if (
          hourFilter &&
          !rowInLastHourWindow(
            row,
            hourFilter.startUtcMs,
            hourFilter.endUtcMsExclusive,
          )
        ) {
          continue;
        }
        if (!row.spend || Number(row.spend) <= 0) continue;
        const aid = String(row.account_id ?? "").replace(/^act_/, "");
        const acc = aid || String(adAccountId).replace(/^act_/, "");
        row.account_id = acc;
        row.updated_at = new Date().toISOString();
        mapped.push(row);
        kept++;
      }
      perAccount.push({
        account_id: String(adAccountId).replace(/^act_/i, ""),
        fetched,
        kept,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: upErr } = await upsertChunks(supabase, mapped, 300);
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr, inserted: 0 }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        since,
        until,
        rows: mapped.length,
        accounts: perAccount,
        timezone: reportTz,
        window: usedExplicitSinceUntil
          ? "explicit"
          : hourFilter
          ? "last_hour"
          : "today",
        hour_window_utc: hourWindowMeta,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
