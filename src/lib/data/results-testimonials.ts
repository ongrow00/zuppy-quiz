/** Perfil do carrossel: H = homem, M = mulher; WL = emagrecimento, MG = ganho de massa. */
export type ResultTestimonialGender = 'H' | 'M';
export type ResultTestimonialGoal = 'WL' | 'MG';

export type ResultTestimonial = {
	src: string;
	/** Nome de exibição estilo rede social (único por pessoa). */
	user: string;
	prevKg: number;
	currKg: number;
	gender: ResultTestimonialGender;
	goal: ResultTestimonialGoal;
};

/**
 * Depoimentos visuais: fotos em /static/assets/testimonials/.
 * Peso anterior / atual são estimativas plausíveis a partir do antes/depois (não são dados reais).
 */
export const RESULT_TESTIMONIALS: ResultTestimonial[] = [
	// Homem — emagrecimento (WL)
	{
		src: '/assets/testimonials/wl-h-1.png',
		user: 'rafael.campos',
		prevKg: 91,
		currKg: 75,
		gender: 'H',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-h-2.png',
		user: 'thiago.ribeiro',
		prevKg: 88,
		currKg: 72,
		gender: 'H',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-h-3.png',
		user: 'gustavo.mendes',
		prevKg: 96,
		currKg: 79,
		gender: 'H',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-h-4.png',
		user: 'felipe.nogueira',
		prevKg: 93,
		currKg: 77,
		gender: 'H',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-h-5.png',
		user: 'rodrigo.batista',
		prevKg: 88,
		currKg: 74,
		gender: 'H',
		goal: 'WL'
	},
	// Mulher — emagrecimento (WL)
	{
		src: '/assets/testimonials/wl-m-1.png',
		user: 'beatriz.moreira',
		prevKg: 69,
		currKg: 58,
		gender: 'M',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-m-2.png',
		user: 'juliana.teixeira',
		prevKg: 77,
		currKg: 61,
		gender: 'M',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-m-3.png',
		user: 'larissa.freitas',
		prevKg: 76,
		currKg: 59,
		gender: 'M',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-m-4.png',
		user: 'fernanda.peixoto',
		prevKg: 66,
		currKg: 58,
		gender: 'M',
		goal: 'WL'
	},
	{
		src: '/assets/testimonials/wl-m-5.png',
		user: 'amanda.correia',
		prevKg: 74,
		currKg: 56,
		gender: 'M',
		goal: 'WL'
	},
	// Mulher — ganho de massa (MG)
	{
		src: '/assets/testimonials/mg-m-1.png',
		user: 'camila.gomes',
		prevKg: 57,
		currKg: 62,
		gender: 'M',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-m-2.png',
		user: 'patricia.vasconcelos',
		prevKg: 54,
		currKg: 58,
		gender: 'M',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-m-3.png',
		user: 'raquel.monteiro',
		prevKg: 56,
		currKg: 60,
		gender: 'M',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-m-4.png',
		user: 'vanessa.arantes',
		prevKg: 53,
		currKg: 57,
		gender: 'M',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-m-5.png',
		user: 'leticia.duarte',
		prevKg: 64,
		currKg: 63,
		gender: 'M',
		goal: 'MG'
	},
	// Homem — ganho de massa (MG)
	{
		src: '/assets/testimonials/mg-h-1.png',
		user: 'ricardo.moraes',
		prevKg: 97,
		currKg: 82,
		gender: 'H',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-h-2.png',
		user: 'matheus.lacerda',
		prevKg: 72,
		currKg: 79,
		gender: 'H',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-h-3.png',
		user: 'leonardo.pinto',
		prevKg: 87,
		currKg: 82,
		gender: 'H',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-h-4.png',
		user: 'bruno.queiroz',
		prevKg: 84,
		currKg: 86,
		gender: 'H',
		goal: 'MG'
	},
	{
		src: '/assets/testimonials/mg-h-5.png',
		user: 'diego.sampaio',
		prevKg: 88,
		currKg: 77,
		gender: 'H',
		goal: 'MG'
	}
];
