import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/** Countdown 15:09 (15 min 9 s) para oferta; uma única fonte de verdade. */
export const TOTAL_SECONDS = 15 * 60 + 9;

const remaining = writable(TOTAL_SECONDS);
let intervalId: ReturnType<typeof setInterval> | null = null;

/** Valor reativo em segundos restantes. */
export function getRemaining() {
	return remaining;
}

/** Formata segundos como MM:SS. */
export function formatCountdown(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Inicia o countdown (chamar ao exibir a página de resultados). Para ao chamar stop(). */
export function start(): () => void {
	if (!browser) return () => {};
	remaining.set(TOTAL_SECONDS);
	if (intervalId) clearInterval(intervalId);
	intervalId = setInterval(() => {
		remaining.update((r) => Math.max(0, r - 1));
	}, 1000);
	return () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	};
}
