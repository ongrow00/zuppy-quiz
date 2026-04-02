/**
 * Preferências do relatório Meta (data + bruto/líquido) no navegador.
 * Usa localStorage — sobrevive a recarregar a página e fechar a aba (até limpar dados do site).
 *
 * Exemplo em +page.svelte:
 *   import { browser } from '$app/environment';
 *   import { loadReportDate, saveReportDate, loadBillingMode, saveBillingMode } from '$lib/utils/meta-ads-report-prefs';
 *   onMount(() => {
 *     if (browser) {
 *       selectedDate = loadReportDate() ?? todayIso();
 *       billingMode = loadBillingMode();
 *     }
 *   });
 *   $effect(() => { if (browser && selectedDate) saveReportDate(selectedDate); });
 *   $effect(() => { if (browser) saveBillingMode(billingMode); });
 */

const KEY_DATE = 'zuppy_meta_ads_report_date';
const KEY_BILLING = 'zuppy_meta_ads_billing_mode';

export type BillingMode = 'gross' | 'net';

function canUseStorage(): boolean {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeGet(key: string): string | null {
	if (!canUseStorage()) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSet(key: string, value: string): void {
	if (!canUseStorage()) return;
	try {
		localStorage.setItem(key, value);
	} catch {
		/* quota / private mode */
	}
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Data do relatório em YYYY-MM-DD ou null se inválida/ausente. */
export function loadReportDate(): string | null {
	const raw = safeGet(KEY_DATE)?.trim();
	if (!raw || !DATE_RE.test(raw)) return null;
	return raw;
}

export function saveReportDate(date: string): void {
	const d = date.trim();
	if (!DATE_RE.test(d)) return;
	safeSet(KEY_DATE, d);
}

export function loadBillingMode(): BillingMode {
	const raw = safeGet(KEY_BILLING)?.trim().toLowerCase();
	if (raw === 'net' || raw === 'liquid' || raw === 'liquido') return 'net';
	return 'gross';
}

export function saveBillingMode(mode: BillingMode): void {
	safeSet(KEY_BILLING, mode);
}

export function clearMetaAdsReportPrefs(): void {
	if (!canUseStorage()) return;
	try {
		localStorage.removeItem(KEY_DATE);
		localStorage.removeItem(KEY_BILLING);
	} catch {
		/* ignore */
	}
}
