import type { Question } from './types';

const emptyScores = {};

export const questions: Question[] = [
	// ——— 1. OBJETIVO E PERFIL ———
	{
		id: 'goal_type',
		order: 1,
		section: 'Objetivo',
		text: 'Qual é o seu principal objetivo neste momento?',
		subtext: 'Vamos usar seu objetivo para montar um plano feito para você.',
		type: 'single',
		required: true,
		variable: 'goal_type',
		options: [
			{ id: 'goal-emagrecer', text: 'Emagrecer', scores: emptyScores },
			{ id: 'goal-massa', text: 'Ganhar massa muscular', scores: emptyScores }
		]
	},
	{
		id: 'weight_medication_use',
		order: 2,
		section: 'Objetivo',
		text: 'Você utiliza algum tratamento ou medicação para emagrecer?',
		subtext: 'Isso nos ajuda a adaptar seu plano ao que já faz parte da sua rotina.',
		type: 'single',
		required: true,
		variable: 'weight_medication_use',
		showIf: {
			conditions: [{ questionId: 'goal_type', operator: 'eq', value: 'goal-emagrecer' }],
			logic: 'AND'
		},
		options: [
			{
				id: 'med-glp1',
				text: 'Sim, uso GLP-1',
				description: 'Com Ozempic, Mounjaro, Wegovy...',
				scores: emptyScores
			},
			{ id: 'med-outro', text: 'Sim, outro medicamento', scores: emptyScores },
			{ id: 'med-gostaria', text: 'Não, mas gostaria', scores: emptyScores },
			{ id: 'med-nao', text: 'Não utilizo', scores: emptyScores }
		]
	},
	{
		id: 'info_medication',
		order: 2.5,
		section: 'Objetivo',
		text: 'Plano personalizado para você',
		type: 'info',
		required: false,
		copyTitle: 'Seu plano será personalizado',
		copyBody:
			'Seu protocolo de calorias será desenhado especialmente para quem está em tratamento.',
		ctaText: 'Continuar',
		showIf: {
			conditions: [
				{ questionId: 'goal_type', operator: 'eq', value: 'goal-emagrecer' },
				{ questionId: 'weight_medication_use', operator: 'eq', value: 'med-glp1' }
			],
			logic: 'AND'
		}
	},
	{
		id: 'hormonal_resource',
		order: 3,
		section: 'Objetivo',
		text: 'Você utiliza ou já utilizou algum recurso hormonal para ganhar massa muscular?',
		subtext: 'Vamos considerar isso na hora de calcular suas necessidades.',
		type: 'single',
		required: true,
		variable: 'hormonal_resource',
		showIf: {
			conditions: [{ questionId: 'goal_type', operator: 'eq', value: 'goal-massa' }],
			logic: 'AND'
		},
		options: [
			{ id: 'hr-sim', text: 'Sim, uso atualmente', scores: emptyScores },
			{ id: 'hr-parei', text: 'Já usei, mas parei', scores: emptyScores },
			{ id: 'hr-nao', text: 'Não utilizo', scores: emptyScores }
		]
	},
	{
		id: 'gender',
		order: 4,
		section: 'Objetivo',
		text: 'Qual é o seu sexo?',
		subtext: 'Homens e mulheres têm metabolismos diferentes. Isso afeta diretamente seu plano.',
		type: 'single',
		required: true,
		variable: 'gender',
		optionsLayout: 'horizontal',
		options: [
			{ id: 'gender-f', text: 'Feminino', scores: emptyScores, imageUrl: '/assets/mulher.png' },
			{ id: 'gender-m', text: 'Masculino', scores: emptyScores, imageUrl: '/assets/homem.png' }
		]
	},
	{
		id: 'age_years',
		order: 5,
		section: 'Objetivo',
		text: 'Qual é a sua idade?',
		subtext: 'Sua faixa etária influencia o ritmo do seu metabolismo e as suas necessidades calóricas.',
		type: 'ruler',
		required: true,
		variable: 'age_years',
		min: 18,
		max: 99,
		unit: 'anos'
	},
	{
		id: 'height_cm',
		order: 6,
		section: 'Objetivo',
		text: 'Qual é a sua altura?',
		subtext: 'Usamos sua altura para calcular seu gasto calórico diário com precisão.',
		type: 'ruler',
		required: true,
		variable: 'height_cm',
		min: 100,
		max: 220,
		unit: 'cm'
	},
	{
		id: 'weight_current_kg',
		order: 7,
		section: 'Objetivo',
		text: 'Qual é o seu peso atual?',
		subtext: 'Esse é nosso ponto de partida para calcular o melhor caminho até seu objetivo.',
		type: 'ruler',
		required: true,
		variable: 'weight_current_kg',
		min: 30,
		max: 200,
		unit: 'kg'
	},
	{
		id: 'weight_goal_kg',
		order: 8,
		section: 'Objetivo',
		text: 'Qual peso você gostaria de alcançar?',
		subtext: 'Vamos calcular exatamente o que você precisa por dia para chegar lá.',
		type: 'ruler',
		required: true,
		variable: 'weight_goal_kg',
		min: 30,
		max: 200,
		unit: 'kg'
	},
	{
		id: 'timeframe',
		order: 9,
		section: 'Objetivo',
		text: 'Em quanto tempo você gostaria de começar a ver mudanças?',
		subtext: 'Isso nos ajuda a definir um ritmo seguro e realista para você.',
		type: 'single',
		required: true,
		variable: 'timeframe',
		options: [
			{ id: 'tf-30dias', text: '30 dias', description: 'Mudanças Iniciais', scores: emptyScores },
			{ id: 'tf-3meses', text: '3 meses', description: 'Transformação Visível', scores: emptyScores },
			{ id: 'tf-6meses', text: '6 meses', description: 'Mudança de Vida', scores: emptyScores },
			{ id: 'tf-1ano', text: '1 ano', description: 'Transformação Completa', scores: emptyScores }
		]
	},
	{
		id: 'life_impact',
		order: 10,
		section: 'Objetivo',
		text: 'O que mais mudaria na sua vida quando você alcançar seu objetivo?',
		subtext: 'Entender sua motivação real nos ajuda a manter você no caminho certo.',
		type: 'multiple',
		required: true,
		variable: 'life_impact',
		options: [
			{ id: 'li-autoestima', text: 'Minha autoestima', scores: emptyScores },
			{ id: 'li-energia', text: 'Minha energia no dia a dia', scores: emptyScores },
			{ id: 'li-aparencia', text: 'Minha aparência', scores: emptyScores },
			{ id: 'li-saude', text: 'Minha saúde', scores: emptyScores },
			{ id: 'li-confianca', text: 'Minha confiança', scores: emptyScores }
		]
	},
	{
		id: 'event_type',
		order: 35,
		section: 'Objetivo',
		text: 'Tem algum evento especial te motivando a alcançar seu objetivo agora?',
		subtext: 'Se tiver uma data em mente, vamos usar isso para deixar seu plano ainda mais preciso.',
		type: 'single',
		required: true,
		variable: 'event_type',
		options: [
			{ id: 'event-nenhuma', text: 'Não tenho', scores: emptyScores },
			{ id: 'event-casamento', text: 'Casamento', scores: emptyScores },
			{ id: 'event-viagem', text: 'Viagem', scores: emptyScores },
			{ id: 'event-verao', text: 'Verão', scores: emptyScores },
			{ id: 'event-aniversario', text: 'Aniversário', scores: emptyScores },
			{ id: 'event-reencontro', text: 'Reencontro', scores: emptyScores }
		]
	},
	{
		id: 'event_date',
		order: 36,
		section: 'Objetivo',
		text: 'Quando será esse evento?',
		subtext: 'Vamos calcular se é possível chegar ao seu peso desejado antes do evento e qual ritmo ideal para isso.',
		type: 'date',
		required: true,
		variable: 'event_date',
		showIf: {
			conditions: [{ questionId: 'event_type', operator: 'neq', value: 'event-nenhuma' }],
			logic: 'AND'
		}
	},

	// ——— 2. AUTOIMAGEM E TRANSFORMAÇÃO ———
	{
		id: 'mr-2',
		order: 23,
		section: 'Autoimagem',
		text: 'Checkpoint: Perfil de transformação mapeado',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'body_current',
		order: 14,
		section: 'Autoimagem',
		text: 'Como você se enxerga hoje?',
		subtext: 'Queremos entender onde você está para traçar o melhor caminho até seu objetivo.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_current'
	},
	{
		id: 'body_goal_visual',
		order: 15,
		section: 'Autoimagem',
		text: 'Como você quer se ver após alcançar seu objetivo?',
		subtext: 'Nos mostre como imagina seu corpo ao chegar no seu peso desejado.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_goal_visual'
	},
	{
		id: 'focus_areas',
		order: 16,
		section: 'Autoimagem',
		text: 'Qual área do seu corpo mais te incomoda hoje?',
		subtext: 'Vamos considerar essa informação no seu plano para acelerar o processo.',
		type: 'multiple',
		required: true,
		variable: 'focus_areas',
		options: [
			{ id: 'fa-inteiro', text: 'Corpo todo', scores: emptyScores },
			{ id: 'fa-barriga', text: 'Barriga', scores: emptyScores },
			{ id: 'fa-pernas', text: 'Pernas e coxas', scores: emptyScores },
			{ id: 'fa-bracos', text: 'Braços', scores: emptyScores },
			{ id: 'fa-peito', text: 'Peito', scores: emptyScores },
			{ id: 'fa-gluteos', text: 'Glúteos', scores: emptyScores }
		]
	},

	{
		id: 'vp-1',
		order: 13.5,
		section: 'Histórico',
		text: 'Feature info 1',
		type: 'feature_info',
		required: false,
		ctaText: 'Continuar →'
	},

	// ——— 3. DOR E HISTÓRICO ———
	{
		id: 'weight_pattern',
		order: 17,
		section: 'Histórico',
		text: 'Nos últimos anos, seu peso aumentou de forma constante ou oscilou?',
		subtext: 'Entender o padrão do seu peso nos ajuda a identificar os melhores ajustes para o seu caso.',
		type: 'single',
		required: true,
		variable: 'weight_pattern',
		options: [
			{ id: 'wp-progressivo', text: 'Sim, ganhei progressivamente', scores: emptyScores },
			{ id: 'wp-oscilou', text: 'Oscilou bastante', scores: emptyScores },
			{ id: 'wp-estavel', text: 'Fiquei estável', scores: emptyScores },
			{ id: 'wp-voltou', text: 'Emagreci e voltei a ganhar', scores: emptyScores }
		]
	},
	{
		id: 'clothes_fitting',
		order: 18,
		section: 'Histórico',
		text: 'Suas roupas estão ficando mais apertadas ou desconfortáveis?',
		subtext: 'Esse é um dos sinais mais claros de como seu corpo está respondendo ao longo do tempo.',
		type: 'single',
		required: true,
		variable: 'clothes_fitting',
		options: [
			{ id: 'cf-sim', text: 'Sim, com frequência', scores: emptyScores },
			{ id: 'cf-pouco', text: 'Um pouco', scores: emptyScores },
			{ id: 'cf-nao', text: 'Não', scores: emptyScores }
		]
	},
	{
		id: 'confidence_impact',
		order: 19,
		section: 'Histórico',
		text: 'Como seu peso atual impacta sua confiança hoje?',
		subtext: 'Queremos entender o impacto real que isso tem na sua vida para personalizar sua jornada.',
		type: 'single',
		required: true,
		variable: 'confidence_impact',
		options: [
			{ id: 'ci-muito', text: 'Muito, afeta bastante minha autoestima', scores: emptyScores },
			{ id: 'ci-pouco', text: 'Um pouco, incomoda mas não paralisa', scores: emptyScores },
			{ id: 'ci-quase', text: 'Quase nada', scores: emptyScores },
			{ id: 'ci-nao', text: 'Não impacta', scores: emptyScores }
		]
	},
	{
		id: 'last_satisfied',
		order: 20,
		section: 'Histórico',
		text: 'Quando foi a última vez que você se sentiu satisfeito(a) com seu peso?',
		subtext: 'Isso nos dá uma referência do que já foi possível para você. E pode ser de novo.',
		type: 'single',
		required: true,
		variable: 'last_satisfied',
		options: [
			{ id: 'ls-1ano', text: 'Menos de 1 ano', scores: emptyScores },
			{ id: 'ls-1a3', text: '1 a 3 anos', scores: emptyScores },
			{ id: 'ls-mais3', text: 'Mais de 3 anos', scores: emptyScores },
			{ id: 'ls-nunca', text: 'Nunca', scores: emptyScores }
		]
	},
	{
		id: 'previous_attempts',
		order: 21,
		section: 'Histórico',
		text: 'Você já tentou mudar sua alimentação ou hábitos antes?',
		subtext: 'Saber o que você já viveu nos ajuda a evitar os mesmos erros desta vez.',
		type: 'single',
		required: true,
		variable: 'previous_attempts',
		options: [
			{ id: 'pa-varias', text: 'Sim, várias vezes', scores: emptyScores },
			{ id: 'pa-poucas', text: 'Sim, poucas vezes', scores: emptyScores },
			{ id: 'pa-primeira', text: 'Não, é a primeira vez', scores: emptyScores }
		]
	},
	{
		id: 'abandonment_pattern',
		order: 22,
		section: 'Histórico',
		text: 'O que normalmente acontece depois das primeiras semanas tentando mudar?',
		subtext: 'Identificar seu padrão é o primeiro passo para quebrar esse ciclo de vez.',
		type: 'single',
		required: true,
		variable: 'abandonment_pattern',
		showIf: {
			conditions: [{ questionId: 'previous_attempts', operator: 'neq', value: 'pa-primeira' }],
			logic: 'AND'
		},
		options: [
			{ id: 'ap-motivacao', text: 'Perco a motivação', scores: emptyScores },
			{ id: 'ap-resultado', text: 'Não vejo resultado rápido e desisto', scores: emptyScores },
			{ id: 'ap-rotina', text: 'Minha rotina atrapalha', scores: emptyScores },
			{ id: 'ap-habitos', text: 'Volto aos hábitos antigos', scores: emptyScores }
		]
	},
	{
		id: 'mr-1',
		order: 13,
		section: 'Histórico',
		text: 'Checkpoint: Histórico mapeado',
		type: 'microresult',
		required: false,
		ctaText: 'Quero chegar lá →'
	},

	// ——— 4. ROTINA E SAÚDE ———
	{
		id: 'eating_pattern',
		order: 25,
		section: 'Rotina',
		text: 'Como é o seu padrão alimentar hoje?',
		subtext: 'Seu plano vai se encaixar na sua rotina. não o contrário.',
		type: 'single',
		required: true,
		variable: 'eating_pattern',
		options: [
			{ id: 'ep-organizado', text: 'Organizado, tenho horários definidos', scores: emptyScores },
			{ id: 'ep-irregular', text: 'Irregular, como quando dá', scores: emptyScores },
			{ id: 'ep-fora', text: 'Como muito fora ou peço delivery', scores: emptyScores },
			{ id: 'ep-pulo', text: 'Pulo refeições com frequência', scores: emptyScores }
		]
	},
	{
		id: 'hunger_moments',
		order: 26,
		section: 'Rotina',
		text: 'Em quais momentos do dia você sente mais fome?',
		subtext: 'Vamos distribuir suas calorias nesses momentos para você não passar fome.',
		type: 'multiple',
		required: true,
		variable: 'hunger_moments',
		options: [
			{ id: 'hm-manha', text: 'Manhã', scores: emptyScores },
			{ id: 'hm-almoco', text: 'Almoço', scores: emptyScores },
			{ id: 'hm-tarde', text: 'Tarde', scores: emptyScores },
			{ id: 'hm-noite', text: 'Noite', scores: emptyScores },
			{ id: 'hm-madrugada', text: 'Madrugada', scores: emptyScores }
		]
	},
	{
		id: 'food_influences',
		order: 27,
		section: 'Rotina',
		text: 'O que mais influencia suas escolhas na hora de comer?',
		subtext: 'Entender seus gatilhos nos ajuda a criar estratégias reais. sem depender só de força de vontade.',
		type: 'multiple',
		required: true,
		variable: 'food_influences',
		options: [
			{ id: 'fi-fome', text: 'Fome mesmo', scores: emptyScores },
			{ id: 'fi-ansiedade', text: 'Ansiedade ou estresse', scores: emptyScores },
			{ id: 'fi-tedio', text: 'Tédio', scores: emptyScores },
			{ id: 'fi-disponivel', text: 'O que está disponível no momento', scores: emptyScores },
			{ id: 'fi-companhia', text: 'Companhia', scores: emptyScores }
		]
	},
	{
		id: 'junk_frequency',
		order: 28,
		section: 'Rotina',
		text: 'Com que frequência consome doces, ultraprocessados ou bebidas calóricas?',
		subtext: 'Não vamos te pedir para cortar nada. apenas entender o que faz parte da sua vida hoje.',
		type: 'single',
		required: true,
		variable: 'junk_frequency',
		options: [
			{ id: 'jf-todo-dia', text: 'Todo dia', scores: emptyScores },
			{ id: 'jf-semana', text: 'Algumas vezes por semana', scores: emptyScores },
			{ id: 'jf-raramente', text: 'Raramente', scores: emptyScores },
			{ id: 'jf-quase-nunca', text: 'Quase nunca', scores: emptyScores }
		]
	},
	{
		id: 'activity_level',
		order: 29,
		section: 'Rotina',
		text: 'Qual é o seu nível de atividade física?',
		subtext: 'Isso impacta diretamente quantas calorias você pode consumir por dia.',
		type: 'single',
		required: true,
		variable: 'activity_level',
		options: [
			{ id: 'al-sedentario', text: 'Sedentário(a)', description: 'Fico sentado(a) a maior parte do dia', scores: emptyScores },
			{ id: 'al-leve', text: 'Leve', description: 'Me movimento um pouco', scores: emptyScores },
			{ id: 'al-moderado', text: 'Moderado', description: 'Me exercito algumas vezes por semana', scores: emptyScores },
			{ id: 'al-ativo', text: 'Ativo(a)', description: 'Me exercito com frequência', scores: emptyScores }
		]
	},
	{
		id: 'sleep_quality',
		order: 30,
		section: 'Rotina',
		text: 'Como está sua qualidade de sono?',
		subtext: 'O sono afeta seus hormônios de fome e saciedade. isso influencia diretamente seu resultado.',
		type: 'single',
		required: true,
		variable: 'sleep_quality',
		options: [
			{ id: 'sq-bem', text: 'Durmo bem e acordo descansado(a)', scores: emptyScores },
			{ id: 'sq-cansado', text: 'Durmo, mas acordo cansado(a)', scores: emptyScores },
			{ id: 'sq-dificuldade', text: 'Tenho dificuldade para dormir', scores: emptyScores },
			{ id: 'sq-pouco', text: 'Durmo pouco, menos de 6 horas', scores: emptyScores }
		]
	},
	{
		id: 'water_intake',
		order: 31,
		section: 'Rotina',
		text: 'Quantos copos de água você costuma beber por dia?',
		subtext: 'A hidratação influencia sua fome e seu metabolismo. dois fatores essenciais para seu objetivo.',
		type: 'single',
		required: true,
		variable: 'water_intake',
		options: [
			{ id: 'wi-menos2', text: 'Menos de 2 copos', scores: emptyScores },
			{ id: 'wi-2a4', text: 'Entre 2 e 4 copos', scores: emptyScores },
			{ id: 'wi-4a6', text: 'Entre 4 e 6 copos', scores: emptyScores },
			{ id: 'wi-mais6', text: 'Mais de 6 copos', scores: emptyScores }
		]
	},
	{
		id: 'tracking_history',
		order: 32,
		section: 'Rotina',
		text: 'Você já tentou acompanhar sua alimentação antes?',
		subtext: 'Saber o que você já experimentou nos ajuda a oferecer algo diferente e mais eficaz.',
		type: 'single',
		required: true,
		variable: 'tracking_history',
		options: [
			{ id: 'th-nunca', text: 'Nunca tentei', scores: emptyScores },
			{ id: 'th-app', text: 'Sim, usei um aplicativo', scores: emptyScores },
			{ id: 'th-nutricionista', text: 'Sim, com nutricionista', scores: emptyScores },
			{ id: 'th-conta-propria', text: 'Sim, por conta própria', scores: emptyScores }
		]
	},
	{
		id: 'health_conditions',
		order: 33,
		section: 'Rotina',
		text: 'Possui alguma condição de saúde que possa influenciar seu objetivo?',
		subtext: 'Algumas condições afetam diretamente o metabolismo. vamos considerar isso no seu plano.',
		type: 'multiple',
		required: false,
		variable: 'health_conditions',
		options: [
			{ id: 'hc-nenhuma', text: 'Nenhuma', scores: emptyScores },
			{ id: 'hc-hipotireoidismo', text: 'Hipotireoidismo', scores: emptyScores },
			{ id: 'hc-diabetes', text: 'Diabetes ou pré-diabetes', scores: emptyScores },
			{ id: 'hc-sop', text: 'SOP', description: 'Síndrome dos ovários policísticos', scores: emptyScores },
			{ id: 'hc-ansiedade', text: 'Ansiedade ou depressão', scores: emptyScores },
			{ id: 'hc-hipertensao', text: 'Hipertensão', scores: emptyScores },
			{ id: 'hc-outra', text: 'Outra', scores: emptyScores }
		]
	},
	{
		id: 'readiness',
		order: 34,
		section: 'Rotina',
		text: 'O quanto você está pronto(a) para fazer pequenos ajustes e chegar ao seu objetivo?',
		subtext: 'Seu nível de prontidão define o ritmo ideal para começar sem pressão.',
		type: 'single',
		required: true,
		variable: 'readiness',
		options: [
			{ id: 'rd-pronto', text: 'Totalmente pronto(a), quero começar hoje', scores: emptyScores },
			{ id: 'rd-motivado', text: 'Bastante motivado(a)', scores: emptyScores },
			{ id: 'rd-inseguro', text: 'Um pouco inseguro(a), mas quero tentar', scores: emptyScores }
		]
	},
	{
		id: 'mr-3',
		order: 37,
		section: 'Rotina',
		text: 'Checkpoint: Rotina mapeada',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},

	{
		id: 'vp-2',
		order: 23.5,
		section: 'Autoimagem',
		text: 'Feature info 2',
		type: 'feature_info',
		required: false,
		ctaText: 'Continuar →'
	},

	// ——— 5. PERSONALIZAÇÃO DO PLANO ———
	{
		id: 'include_breakfast',
		order: 38,
		section: 'Personalização',
		text: 'Deseja incluir café da manhã no seu plano?',
		subtext: 'Seu plano vai respeitar seus hábitos. não vai te forçar a mudar o que já funciona.',
		type: 'single',
		required: true,
		variable: 'include_breakfast',
		options: [
			{ id: 'ib-sim', text: 'Sim', scores: emptyScores },
			{ id: 'ib-nao', text: 'Não costumo tomar café da manhã', scores: emptyScores }
		]
	},
	{
		id: 'meal_count',
		order: 39,
		section: 'Personalização',
		text: 'Quantas refeições prefere fazer por dia?',
		subtext: 'Vamos distribuir suas calorias da forma que melhor se encaixa na sua rotina.',
		type: 'single',
		required: true,
		variable: 'meal_count',
		options: [
			{ id: 'mc-2', text: '2', scores: emptyScores },
			{ id: 'mc-3', text: '3', scores: emptyScores },
			{ id: 'mc-4', text: '4', scores: emptyScores },
			{ id: 'mc-5', text: '5', scores: emptyScores },
			{ id: 'mc-6', text: '6', scores: emptyScores },
			{ id: 'mc-7', text: '7', scores: emptyScores },
			{ id: 'mc-8', text: '8', scores: emptyScores }
		]
	},
	{
		id: 'foods_liked',
		order: 40,
		section: 'Personalização',
		text: 'Quais alimentos você mais gosta de comer?',
		subtext: 'Seu plano vai ser montado com o que você já gosta. sem abrir mão do prazer.',
		type: 'multiple',
		required: false,
		variable: 'foods_liked',
		options: [
			{ id: 'fl-tudo', text: 'Como de Tudo', scores: emptyScores },
			{ id: 'fl-arroz', text: 'Arroz, feijão e proteína', scores: emptyScores },
			{ id: 'fl-massas', text: 'Massas e pães', scores: emptyScores },
			{ id: 'fl-frutas', text: 'Frutas e verduras', scores: emptyScores },
			{ id: 'fl-fastfood', text: 'Fast food e lanches', scores: emptyScores },
			{ id: 'fl-doces', text: 'Doces e sobremesas', scores: emptyScores },
			{ id: 'fl-japones', text: 'Comida japonesa', scores: emptyScores },
			{ id: 'fl-arabe', text: 'Comida árabe / mediterrânea', scores: emptyScores }
		]
	},
	{
		id: 'foods_disliked',
		order: 41,
		section: 'Personalização',
		text: 'Tem algum alimento que prefere não incluir no seu plano?',
		subtext: 'Seu plano vai respeitar suas preferências. sem forçar nada que você não queira.',
		type: 'multiple',
		required: false,
		variable: 'foods_disliked',
		options: [
			{ id: 'fd-nenhum', text: 'Como de tudo', scores: emptyScores },
			{ id: 'fd-carne', text: 'Carne vermelha', scores: emptyScores },
			{ id: 'fd-frango', text: 'Frango', scores: emptyScores },
			{ id: 'fd-peixe', text: 'Peixes e frutos do mar', scores: emptyScores },
			{ id: 'fd-ovos', text: 'Ovos', scores: emptyScores },
			{ id: 'fd-laticinios', text: 'Laticínios', description: 'leite, queijo, iogurte', scores: emptyScores },
			{ id: 'fd-leguminosas', text: 'Leguminosas', description: 'feijão, lentilha, grão-de-bico', scores: emptyScores },
			{ id: 'fd-carboidratos', text: 'Carboidratos', description: 'pão, massa, arroz', scores: emptyScores },
			{ id: 'fd-outro', text: 'Outro', scores: emptyScores }
		]
	},
	{
		id: 'food_restrictions',
		order: 42,
		section: 'Personalização',
		text: 'Possui alguma restrição alimentar?',
		subtext: 'Vamos garantir que seu plano seja 100% seguro e adequado para você.',
		type: 'multiple',
		required: false,
		variable: 'food_restrictions',
		options: [
			{ id: 'fr-nenhuma', text: 'Nenhuma', scores: emptyScores },
			{ id: 'fr-lactose', text: 'Intolerância à lactose', scores: emptyScores },
			{ id: 'fr-gluten', text: 'Doença celíaca', description: 'Intolerância ao glúten', scores: emptyScores },
			{ id: 'fr-diabetes', text: 'Diabetes', description: 'Controle de açúcar', scores: emptyScores },
			{ id: 'fr-hipertensao', text: 'Hipertensão', description: 'Baixo sódio', scores: emptyScores },
			{ id: 'fr-frutos-mar', text: 'Alergia a frutos do mar', scores: emptyScores },
			{ id: 'fr-nozes', text: 'Alergia a nozes ou amendoim', scores: emptyScores },
			{ id: 'fr-soja', text: 'Alergia à soja', scores: emptyScores },
			{ id: 'fr-vegetariano', text: 'Vegetariano(a)', scores: emptyScores },
			{ id: 'fr-vegano', text: 'Vegano(a)', scores: emptyScores },
			{ id: 'fr-outro', text: 'Outro', scores: emptyScores }
		]
	},
	{
		id: 'meal_prep_time',
		order: 43,
		section: 'Personalização',
		text: 'Quanto tempo tem disponível para preparar suas refeições?',
		subtext: 'Seu plano vai ser prático e viável para a sua rotina. sem receitas complicadas.',
		type: 'single',
		required: true,
		variable: 'meal_prep_time',
		options: [
			{ id: 'mpt-15', text: 'Menos de 15 minutos', scores: emptyScores },
			{ id: 'mpt-15a30', text: 'Entre 15 e 30 minutos', scores: emptyScores },
			{ id: 'mpt-30a60', text: 'Entre 30 e 60 minutos', scores: emptyScores },
			{ id: 'mpt-bastante', text: 'Tenho bastante tempo', scores: emptyScores }
		]
	},
	{
		id: 'plan_style',
		order: 44,
		section: 'Personalização',
		text: 'Prefere um plano mais simples ou com mais variedade?',
		subtext: 'Você decide o estilo. nós montamos o plano do seu jeito.',
		type: 'single',
		required: true,
		variable: 'plan_style',
		options: [
			{ id: 'ps-simples', text: 'Simples e prático', description: 'Menos decisões, mais resultado', scores: emptyScores },
			{ id: 'ps-variado', text: 'Com variedade', description: 'Gosto de ter opções diferentes', scores: emptyScores },
			{ id: 'ps-tanto-faz', text: 'Tanto faz', scores: emptyScores }
		]
	},
	{
		id: 'vp-3',
		order: 37.5,
		section: 'Rotina',
		text: 'Feature info 3',
		type: 'feature_info',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'mr-4',
		order: 45,
		section: 'Personalização',
		text: 'Checkpoint: Personalização mapeada',
		type: 'microresult',
		required: false,
		ctaText: 'Ver meu plano →'
	}
];
