export type OfferPlan = {
	id: string;
	label: string;
	oldPrice: number;
	price: number;
	monthly: number;
	discountPercent: number;
	badge: string | null;
	/** Checkout Hotmart (cupom já na URL) */
	checkoutUrl: string;
};

/** Planos exibidos na oferta da página de resultados */
export const OFFER_PLANS: OfferPlan[] = [
	{
		id: 'mensal',
		label: 'Plano Black - Mensal',
		oldPrice: 29,
		price: 29,
		monthly: 29,
		discountPercent: 0,
		badge: null,
		checkoutUrl:
			'https://pay.hotmart.com/B104750630D?off=wlpc2j75&checkoutMode=10'
	},
	{
		id: 'semestral',
		label: 'Plano Black - Semestral',
		oldPrice: 109,
		price: 59,
		monthly: 11.07,
		discountPercent: 45,
		badge: 'Mais Vendido',
		checkoutUrl:
			'https://pay.hotmart.com/B104750630D?off=w7uhxggb&checkoutMode=10&offDiscount=PBS45'
	},
	{
		id: 'anual',
		label: 'Plano Black - Anual',
		oldPrice: 179,
		price: 89,
		monthly: 9.2,
		discountPercent: 50,
		badge: null,
		checkoutUrl:
			'https://pay.hotmart.com/B104750630D?off=546hr4ng&checkoutMode=10&offDiscount=PBA44'
	}
];
