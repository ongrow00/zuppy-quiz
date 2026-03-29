/**
 * Parâmetros de pré-preenchimento do checkout Hotmart.
 * @see https://help.hotmart.com/en/article/115003588572/how-do-i-set-up-my-checkout-parameters-
 * UTM + src: https://help.hotmart.com/en/article/216441797/how-can-i-track-the-source-of-my-sales-on-hotmart-
 */

import type { UtmParams } from '$lib/data/types';

export type HotmartPhoneParts = {
	phoneac: string;
	phonenumber: string;
};

/**
 * Converte o WhatsApp salvo (DDI + nacional, só dígitos) em phoneac + phonenumber.
 * Foco em Brasil (+55) e EUA/Canadá (+1); heurísticas simples para PT e AR.
 *
 * **Brasil (doc Hotmart):** `phoneac` = DDD, `phonenumber` = número sem DDD
 * (ex.: &phoneac=11&phonenumber=987654321).
 *
 * @see https://help.hotmart.com/pt-br/article/115003588572/como-configurar-meus-parametros-da-pagina-de-pagamento-
 */
export function parsePhoneForHotmart(raw: string): HotmartPhoneParts | null {
	const digits = raw.replace(/\D/g, '');
	if (digits.length < 10) return null;

	// Brasil: 55 + DDD (2) + 8 ou 9 dígitos
	if (digits.startsWith('55')) {
		let national = digits.slice(2);
		// Cola duplicada / dígitos a mais: mantém os últimos 11 (DDD + celular 9 dígitos)
		if (national.length > 11) {
			national = national.slice(-11);
		}
		if (national.length >= 10 && national.length <= 11) {
			return { phoneac: national.slice(0, 2), phonenumber: national.slice(2) };
		}
		return null;
	}

	// NANP: 1 + área (3) + 7 dígitos
	if (digits.startsWith('1') && digits.length === 11) {
		const national = digits.slice(1);
		return { phoneac: national.slice(0, 3), phonenumber: national.slice(3) };
	}

	// Só número nacional brasileiro (sem DDI), ex. fluxo antigo
	if (digits.length >= 10 && digits.length <= 11) {
		return { phoneac: digits.slice(0, 2), phonenumber: digits.slice(2) };
	}

	// Portugal +351
	if (digits.startsWith('351') && digits.length >= 11) {
		const national = digits.slice(3);
		if (national.length >= 9) {
			return { phoneac: national.slice(0, 3), phonenumber: national.slice(3) };
		}
	}

	// Argentina +54 (DDD 2–4 + assinante; usamos 2 + resto se couber)
	if (digits.startsWith('54') && digits.length >= 12) {
		const national = digits.slice(2);
		if (national.length >= 10) {
			return { phoneac: national.slice(0, 2), phonenumber: national.slice(2) };
		}
	}

	return null;
}

const SRC_MAX_VALUE_LEN = 120;
const UTM_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term'
] as const satisfies readonly (keyof UtmParams)[];

/** Evita quebrar o formato v2|cod:val|… (Hotmart também desaconselha _). */
export function sanitizeHotmartSrcValue(raw: string): string {
	let s = raw.trim().replace(/_/g, '-').replace(/[|]/g, '-').replace(/:/g, '-');
	if (s.length > SRC_MAX_VALUE_LEN) s = s.slice(0, SRC_MAX_VALUE_LEN);
	return s;
}

function sanitizeSrcExtraCode(code: string): string {
	const c = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
	return c.slice(0, 6) || 'x';
}

/**
 * SRC para a Hotmart: v2|utm_source:…|utm_medium:…|…|utm_term:…|(+ extras, ex. offer).
 * Prefixo v2 distingue do formato legado v1|us:|md:|…
 * Retorna null se não houver nada a enviar.
 */
export function buildHotmartSrcV2(
	utm: UtmParams,
	extras?: Record<string, string>
): string | null {
	const parts: string[] = [];

	for (const utmKey of UTM_KEYS) {
		const v = utm[utmKey]?.trim();
		if (v) parts.push(`${utmKey}:${sanitizeHotmartSrcValue(v)}`);
	}

	if (extras) {
		for (const [k, v] of Object.entries(extras).sort(([a], [b]) => a.localeCompare(b))) {
			const t = v?.trim();
			if (t) parts.push(`${sanitizeSrcExtraCode(k)}:${sanitizeHotmartSrcValue(t)}`);
		}
	}

	if (parts.length === 0) return null;
	return `v2|${parts.join('|')}`;
}

export type HotmartCheckoutTracking = {
	utm: UtmParams;
	/** Pares adicionais no src (ex.: offer = código da query ?offer=). */
	srcExtras?: Record<string, string>;
};

export function appendHotmartBuyerParams(
	baseCheckoutUrl: string,
	buyer: { fullName?: string; whatsapp?: string },
	tracking?: HotmartCheckoutTracking
): string {
	let url: URL;
	try {
		url = new URL(baseCheckoutUrl);
	} catch {
		return baseCheckoutUrl;
	}

	const fullName = buyer.fullName?.trim();
	if (fullName) {
		url.searchParams.set('name', fullName);
	}

	const phone = parsePhoneForHotmart(buyer.whatsapp ?? '');
	if (phone) {
		url.searchParams.set('phoneac', phone.phoneac);
		url.searchParams.set('phonenumber', phone.phonenumber);
	}

	if (tracking) {
		const { utm, srcExtras } = tracking;
		for (const key of UTM_KEYS) {
			const v = utm[key]?.trim();
			if (v) url.searchParams.set(key, v);
		}
		const src = buildHotmartSrcV2(utm, srcExtras);
		if (src) url.searchParams.set('src', src);
	}

	return url.toString();
}
