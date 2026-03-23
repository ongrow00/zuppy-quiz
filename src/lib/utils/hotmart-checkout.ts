/**
 * Parâmetros de pré-preenchimento do checkout Hotmart.
 * @see https://help.hotmart.com/en/article/115003588572/how-do-i-set-up-my-checkout-parameters-
 */

export type HotmartPhoneParts = {
	phoneac: string;
	phonenumber: string;
};

/**
 * Converte o WhatsApp salvo (DDI + nacional, só dígitos) em phoneac + phonenumber.
 * Foco em Brasil (+55) e EUA/Canadá (+1); heurísticas simples para PT e AR.
 */
export function parsePhoneForHotmart(raw: string): HotmartPhoneParts | null {
	const digits = raw.replace(/\D/g, '');
	if (digits.length < 10) return null;

	// Brasil: 55 + DDD (2) + 8 ou 9 dígitos
	if (digits.startsWith('55')) {
		const national = digits.slice(2);
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

export function appendHotmartBuyerParams(
	baseCheckoutUrl: string,
	buyer: { fullName?: string; whatsapp?: string }
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

	return url.toString();
}
