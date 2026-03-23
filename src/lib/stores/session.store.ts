import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { SessionParams, UtmParams } from '$lib/data/types';

const SESSION_KEY = 'zuppy-session-params';

const EMPTY: SessionParams = {
	utm: {},
	offer: null
};

function loadFromSession(): SessionParams {
	if (!browser) return { ...EMPTY };
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return { ...EMPTY };
		const parsed = JSON.parse(raw) as SessionParams;
		return {
			utm: parsed.utm ?? {},
			offer: parsed.offer ?? null
		};
	} catch {
		return { ...EMPTY };
	}
}

function saveToSession(state: SessionParams): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

function parseUtmFromSearchParams(sp: URLSearchParams): UtmParams {
	const utm: UtmParams = {};
	const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
	for (const key of keys) {
		const v = sp.get(key);
		if (v) utm[key] = v;
	}
	return utm;
}

function createSessionStore() {
	const { subscribe, set, update } = writable<SessionParams>(loadFromSession());

	return {
		subscribe,

		/**
		 * Mescla UTMs e `offer` da URL na sessão sempre que a URL trouxer esses parâmetros.
		 * Assim links de campanha funcionam mesmo com sessionStorage antigo (antes bloqueava tudo).
		 */
		hydrateFromUrl(searchParams: URLSearchParams) {
			const utmFromUrl = parseUtmFromSearchParams(searchParams);
			const offerRaw = searchParams.get('offer');
			const offerFromUrl =
				offerRaw !== null ? (offerRaw.trim() || null) : null;

			const hasUtmInUrl = Object.keys(utmFromUrl).length > 0;
			const hasOfferInUrl = offerFromUrl != null;

			if (!hasUtmInUrl && !hasOfferInUrl) return;

			update((state) => {
				const next: SessionParams = {
					utm: hasUtmInUrl ? { ...state.utm, ...utmFromUrl } : state.utm,
					offer: hasOfferInUrl ? offerFromUrl : state.offer
				};
				saveToSession(next);
				return next;
			});
		}
	};
}

export const sessionStore = createSessionStore();
