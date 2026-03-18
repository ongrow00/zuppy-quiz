import type { ResultProfile } from './types';

export const profiles: ResultProfile[] = [
	{
		id: 'empreendedor',
		name: 'O Empreendedor',
		tagline: 'Você nasceu para construir o seu próprio caminho',
		description:
			'Você é movido pela liberdade, pela autonomia e pela capacidade de criar algo do zero. Não se encaixa em caixas. Você prefere definir as próprias regras. Seu perfil indica alto potencial para empreendedorismo ou liderança com total autonomia.',
		imageUrl: '/images/profiles/empreendedor.webp',
		cta: {
			text: 'Descubra como acelerar sua jornada empreendedora',
			url: undefined
		},
		threshold: { primaryCategory: 'A', minimumScore: 3 },
		accentColor: '#f97316'
	},
	{
		id: 'estrategista',
		name: 'O Estrategista',
		tagline: 'Você transforma visão em resultados concretos',
		description:
			'Você combina análise profunda com capacidade de execução. Pensa antes de agir, mas quando age, age com precisão. Seu perfil indica alta capacidade para liderança estratégica e gestão de alto nível.',
		imageUrl: '/images/profiles/estrategista.webp',
		cta: {
			text: 'Veja como potencializar sua liderança estratégica',
			url: undefined
		},
		threshold: { primaryCategory: 'D', minimumScore: 3 },
		accentColor: '#6366f1'
	},
	{
		id: 'especialista',
		name: 'O Especialista',
		tagline: 'Seu conhecimento é o seu maior ativo',
		description:
			'Você é apaixonado pelo aprendizado contínuo e pela excelência técnica. Prefere aprofundar do que dispersar. Seu perfil indica alta capacidade para se tornar referência e autoridade na sua área.',
		imageUrl: '/images/profiles/especialista.webp',
		cta: {
			text: 'Descubra como se tornar a referência da sua área',
			url: undefined
		},
		threshold: { primaryCategory: 'C', minimumScore: 3 },
		accentColor: '#0ea5e9'
	},
	{
		id: 'inovador',
		name: 'O Inovador',
		tagline: 'Você enxerga oportunidades onde outros veem obstáculos',
		description:
			'Você é criativo, adaptável e sempre à frente do seu tempo. Não tem medo de experimentar e quebrar padrões. Seu perfil indica alto potencial para cargos de inovação, produto e design estratégico.',
		imageUrl: '/images/profiles/inovador.webp',
		cta: {
			text: 'Explore como transformar criatividade em resultados',
			url: undefined
		},
		threshold: { primaryCategory: 'E', minimumScore: 3 },
		accentColor: '#ec4899'
	},
	{
		id: 'estavel',
		name: 'O Guardião',
		tagline: 'Você constrói sobre bases sólidas e duradouras',
		description:
			'Você valoriza segurança, previsibilidade e estabilidade. Toma decisões conscientes e não corre riscos desnecessários. Seu perfil indica alto potencial para gestão financeira, compliance e carreiras de longo prazo.',
		imageUrl: '/images/profiles/estavel.webp',
		cta: {
			text: 'Descubra como construir segurança e crescimento consistente',
			url: undefined
		},
		threshold: { primaryCategory: 'B', minimumScore: 3 },
		accentColor: '#22c55e'
	},
	{
		id: 'conector',
		name: 'O Conector',
		tagline: 'Você transforma relacionamentos em resultados extraordinários',
		description:
			'Você é movido por pessoas. Sua maior força está na capacidade de criar conexões autênticas, inspirar times e construir redes de alto valor. Seu perfil indica alto potencial para vendas, RH, liderança de pessoas e parcerias estratégicas.',
		imageUrl: '/images/profiles/conector.webp',
		cta: {
			text: 'Veja como usar seu talento relacional ao máximo',
			url: undefined
		},
		threshold: { primaryCategory: 'F', minimumScore: 3 },
		accentColor: '#f59e0b'
	}
];
