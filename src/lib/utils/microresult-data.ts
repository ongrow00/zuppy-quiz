import type { Answers, Question } from '$lib/data/types';

function getOptionLabel(questionId: string, optionId: string, questions: Question[]): string {
	const q = questions.find((x) => x.id === questionId);
	if (!q?.options) return optionId;
	const opt = q.options.find((o) => o.id === optionId);
	return opt?.text ?? optionId;
}

function getOptionLabels(questionId: string, answer: string | string[] | undefined, questions: Question[]): string[] {
	if (answer === undefined || answer === null) return [];
	const ids = Array.isArray(answer) ? answer : [answer];
	return ids.map((id) => getOptionLabel(questionId, id, questions)).filter(Boolean);
}

function top2(questionId: string, answer: string | string[] | undefined, questions: Question[]): string {
	return getOptionLabels(questionId, answer, questions).slice(0, 2).join(', ') || '...';
}

/** Retorna a frase do "futuro" (como quer estar) adaptada ao sexo para encaixar em "ficar [futuro]" ou equivalente. */
function getBodyGoalFraseParaFuturo(
	bodyGoalOptionId: string | undefined,
	isMale: boolean
): string {
	switch (bodyGoalOptionId) {
		// opções antigas (mantidas para compatibilidade)
		case 'body-magro':
			return isMale ? 'magro e definido' : 'magra e definida';
		case 'body-barriga':
			return 'com menos barriga';
		case 'body-saude':
			return 'com saúde, sem exageros';
		case 'body-musculo':
			return isMale ? 'musculoso e forte' : 'musculosa e forte';
		case 'body-grande':
			return isMale ? 'grande e definido' : 'grande e definida';
		case 'body-atletico':
			return isMale ? 'atlético, sem exagerar no volume' : 'atlética, sem exagerar no volume';
		default:
			return 'o seu futuro';
	}
}

export interface NexoCentralizadaMr1 {
	variant: 'mr-1';
	smallLabel: string;
	/** Objetivo para o título/parágrafo (ex.: "emagrecer", "ganhar massa muscular") */
	objetivo: string;
	/** Sexo para o parágrafo (ex.: "homens", "mulheres") */
	sexo: string;
	/** Fragmento "acelerar a X" (ex.: "queima de gordura", "construção de massa muscular") */
	acelerar: string;
}

export interface NexoCentralizadaMr2 {
	variant: 'mr-2';
	/** Sujeito do headline: "Homens", "Mulheres" ou "Pessoas" (conforme sexo escolhido) */
	headlineSubject: string;
	/** Fragmento para "... que treinam [X] com nosso protocolo..." (ex.: "em casa", "na academia") */
	headlineLocalFragment: string;
	/** Fragmento para "montado especificamente pra [X], em..." (ex.: "você treinar em casa") */
	paragraphLocalFragment: string;
	/** Duração por dia (ex.: "1 hora", "30 minutos") — exibido em verde */
	paragraphTempo: string;
	/** Ex.: "3 por semana" — exibido em verde; omitido se não houver dias selecionados */
	paragraphTempoPerWeek?: string;
	showCardioBox: boolean;
	/** Objetivo (ex.: "emagrecer", "ganhar massa") — usado no parágrafo mr-3 */
	objetivo?: string;
}

export interface NexoCentralizadaMr3 {
	variant: 'mr-3';
	/** Peso atual em kg (ex.: 73) */
	currentKg: number;
	/** Meta de peso em kg (ex.: 68) */
	goalKg: number;
	/** Quanto emagrecer/ganhar em valor absoluto (ex.: 5 para "perder até 5kg") */
	kgToReach: number;
	/** Estimativa de semanas para chegar à meta */
	weeksEstimate: number;
	/** true = emagrecer, false = ganhar massa */
	isWeightLoss: boolean;
	/** "homens" ou "mulheres" (conforme sexo escolhido) */
	sexo: string;
	/** Idade em anos (ex.: 35) */
	idade: number | null;
}

export type NexoCentralizada = NexoCentralizadaMr1 | NexoCentralizadaMr2 | NexoCentralizadaMr3;

/** Farol do fator: verde, laranja ou vermelho */
export type LifestyleFactorStatus = 'green' | 'orange' | 'red';

/** Fator de estilo de vida para o layout de micro resultado (mr-5): apenas Sono, Movimento, Motivação */
export interface LifestyleFactor {
	category: 'sono' | 'movimento' | 'energia';
	label: string;
	value: string;
	status: LifestyleFactorStatus;
}

/** Dados para o layout "fatores do estilo de vida" (telas de micro resultado padronizadas) */
export interface LifestyleFactorsData {
	/** Título: "Identificamos fatores... que influenciam seu {goalType}" */
	goalType: string;
	subtitle: string;
	factors: LifestyleFactor[];
	/** Texto da caixa inferior (com **bold** para goalType e "milimetricamente") */
	bottomText: string;
}

export interface MicroResultData {
	title: string;
	bullets: string[];
	insight?: string;
	ctaText: string;
	/** Layout centralizado (mr-1 ou mr-2) — quando presente, substitui title/bullets/insight */
	nexo?: NexoCentralizada;
	/** Layout fatores do estilo de vida (mr-5) — quando presente, usa padrão de micro resultado */
	lifestyleFactors?: LifestyleFactorsData;
}

export function getMicroResultData(
	stepId: string,
	answers: Answers,
	questions: Question[]
): MicroResultData {
	const label = (qId: string, key?: string) =>
		getOptionLabel(qId, answers[key ?? qId] as string, questions) || '...';
	const labelsTop2 = (qId: string, key?: string) => top2(qId, answers[key ?? qId], questions);

	switch (stepId) {
		case 'mr-1': {
			// mr-1: gráfico de quantos kg a pessoa vai perder/ganhar (plano de calorias + WeightLossLineChart)
			const genderId = answers['gender'] as string | undefined;
			const sexo =
				genderId === 'gender-m' ? 'homens' : genderId === 'gender-f' ? 'mulheres' : 'pessoas';
			const rawAge = answers['age_years'];
			const idade =
				rawAge != null
					? (typeof rawAge === 'string' ? parseInt(rawAge, 10) : Array.isArray(rawAge) ? parseInt(String(rawAge[0]), 10) : Number(rawAge))
					: null;
			const idadeValida = typeof idade === 'number' && Number.isFinite(idade) ? idade : null;
			const current = answers['weight_current_kg'];
			const goal = answers['weight_goal_kg'];
			const currentNum = typeof current === 'string' ? parseFloat(current) : NaN;
			const goalNum = typeof goal === 'string' ? parseFloat(goal) : NaN;
			const kgToReach = !isNaN(currentNum) && !isNaN(goalNum) ? Math.abs(goalNum - currentNum) : 0;
			const isWeightLoss = !isNaN(currentNum) && !isNaN(goalNum) && goalNum < currentNum;
			const weeksEstimate =
				kgToReach > 0 ? Math.ceil(kgToReach * (isWeightLoss ? 1.2 : 1.5)) : 12;
			return {
				title: '',
				bullets: [],
				ctaText: 'Perfeito, continuar →',
				nexo: {
					variant: 'mr-1',
					currentKg: isNaN(currentNum) ? 0 : currentNum,
					goalKg: isNaN(goalNum) ? 0 : goalNum,
					kgToReach,
					weeksEstimate,
					isWeightLoss,
					sexo,
					idade: idadeValida
				} as NexoCentralizada
			};
		}
		case 'mr-2': {
			// mr-2: plano de calorias para objetivo + BodyRadarChart
			const goalId = answers['goal_type'] as string | undefined;
			const objetivo =
				goalId === 'goal-emagrecer'
					? 'emagrecer'
					: goalId === 'goal-massa'
						? 'ganhar massa muscular'
						: 'seu objetivo';
			const acelerar =
				goalId === 'goal-emagrecer'
					? 'queima de gordura'
					: goalId === 'goal-massa'
						? 'construção de massa muscular'
						: 'seus resultados';
			const genderId = answers['gender'] as string | undefined;
			const sexo =
				genderId === 'gender-m' ? 'homens' : genderId === 'gender-f' ? 'mulheres' : 'você';
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →',
				nexo: {
					variant: 'mr-2',
					smallLabel: 'Seus Objetivos',
					objetivo,
					sexo,
					acelerar
				} as NexoCentralizada
			};
		}
		case 'mr-3': {
			// mr-3 mostra "2.3x mais rápido" + ProtocolComparisonChart (mesmo conteúdo que mr-2 antes da troca).
			const goalId = answers['goal_type'] as string | undefined;
			const objetivo =
				goalId === 'goal-emagrecer'
					? 'emagrecer'
					: goalId === 'goal-massa'
						? 'ganhar massa muscular'
						: 'seu objetivo';
			const genderId = answers['gender'] as string | undefined;
			const headlineSubject =
				genderId === 'gender-m' ? 'Homens' : genderId === 'gender-f' ? 'Mulheres' : 'Pessoas';
			const nexo2Style = {
				variant: 'mr-3' as const,
				headlineSubject,
				headlineLocalFragment: 'no seu dia a dia',
				paragraphLocalFragment: 'você transformar seu corpo',
				paragraphTempo: 'seu tempo',
				paragraphTempoPerWeek: undefined as string | undefined,
				showCardioBox: false,
				objetivo
			};
			return {
				title: '',
				bullets: [],
				ctaText: 'Quero chegar lá →',
				nexo: nexo2Style as NexoCentralizada
			};
		}
		case 'mr-5': {
			const goalId = answers['goal_type'] as string | undefined;
			const goalType =
				goalId === 'goal-emagrecer'
					? 'emagrecimento'
					: goalId === 'goal-massa'
						? 'ganho de massa'
						: 'objetivo';

			const answer = (qId: string) => (answers[qId] as string | undefined) ?? undefined;

			// Sono: qualidade do sono → valor + farol
			const sleepId = answer('sleep_quality');
			const { value: sonoValue, status: sonoStatus } = (() => {
				switch (sleepId) {
					case 'sq-bem':
						return { value: 'Bem descansado(a)', status: 'green' as const };
					case 'sq-cansado':
						return { value: 'Acordo cansado(a)', status: 'orange' as const };
					case 'sq-dificuldade':
						return { value: 'Dificuldade', status: 'orange' as const };
					case 'sq-pouco':
						return { value: '< 6 horas', status: 'red' as const };
					default:
						return { value: '...', status: 'orange' as const };
				}
			})();

			// Movimento: nível de atividade física
			const activityId = answer('activity_level');
			const { value: movimentoValue, status: movimentoStatus } = (() => {
				switch (activityId) {
					case 'al-sedentario':
						return { value: 'Baixo', status: 'red' as const };
					case 'al-leve':
						return { value: 'Leve', status: 'orange' as const };
					case 'al-moderado':
						return { value: 'Médio', status: 'orange' as const };
					case 'al-ativo':
						return { value: 'Alto', status: 'green' as const };
					default:
						return { value: '...', status: 'orange' as const };
				}
			})();

			// Motivação: prontidão do usuário
			const readinessId = answer('readiness');
			const { value: motivacaoValue, status: motivacaoStatus } = (() => {
				switch (readinessId) {
					case 'rd-pronto':
						return { value: 'Total', status: 'green' as const };
					case 'rd-motivado':
						return { value: 'Alta', status: 'green' as const };
					case 'rd-inseguro':
						return { value: 'Média', status: 'orange' as const };
					case 'rd-avaliando':
						return { value: 'Baixa', status: 'red' as const };
					default:
						return { value: '...', status: 'orange' as const };
				}
			})();

			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →',
				lifestyleFactors: {
					goalType,
					subtitle: 'Seu protocolo será ajustado milimetricamente para funcionar dentro da sua realidade.',
					factors: [
						{ category: 'sono', label: 'Sono', value: sonoValue, status: sonoStatus },
						{
							category: 'movimento',
							label: 'Movimento',
							value: movimentoValue,
							status: movimentoStatus
						},
						{
							category: 'energia',
							label: 'Motivação',
							value: motivacaoValue,
							status: motivacaoStatus
						}
					],
					bottomText: `Com base no seu objetivo de **${goalType}** e nos padrões que identificamos no seu estilo de vida, seu protocolo será ajustado **milimetricamente** para funcionar dentro da sua realidade, não contra ela.`
				}
			};
		}
		case 'mr-4': {
			const goalId = answers['goal_type'] as string | undefined;
			const goalType =
				goalId === 'goal-emagrecer'
					? 'emagrecimento'
					: goalId === 'goal-massa'
						? 'ganho de massa'
						: 'objetivo';

			const mealCountId = answers['meal_count'] as string | undefined;
			const mealCountLabel =
				mealCountId === 'mc-2' ? '2 refeições' :
				mealCountId === 'mc-3' ? '3 refeições' :
				mealCountId === 'mc-4' ? '4 refeições' :
				mealCountId === 'mc-5' ? '5 refeições' :
				mealCountId === 'mc-6' ? '6 refeições' :
				mealCountId === 'mc-7' ? '7 refeições' :
				mealCountId === 'mc-8' ? '8 refeições' : '...';

			const prepTimeId = answers['meal_prep_time'] as string | undefined;
			const prepTimeLabel =
				prepTimeId === 'mpt-15' ? '< 15 min' :
				prepTimeId === 'mpt-15a30' ? '15–30 min' :
				prepTimeId === 'mpt-30a60' ? '30–60 min' :
				prepTimeId === 'mpt-bastante' ? 'Bastante tempo' : '...';

			const planStyleId = answers['plan_style'] as string | undefined;
			const planStyleLabel =
				planStyleId === 'ps-simples' ? 'Simples e prático' :
				planStyleId === 'ps-variado' ? 'Com variedade' :
				planStyleId === 'ps-tanto-faz' ? 'Flexível' : '...';

			return {
				title: '',
				bullets: [],
				ctaText: 'Ver meu plano →',
				lifestyleFactors: {
					goalType,
					subtitle: 'Seu cardápio será montado do seu jeito, com o que você gosta e dentro da sua rotina.',
					factors: [
						{ category: 'sono', label: 'Refeições por dia', value: mealCountLabel, status: 'green' as const },
						{ category: 'movimento', label: 'Tempo de preparo', value: prepTimeLabel, status: 'green' as const },
						{ category: 'energia', label: 'Estilo do plano', value: planStyleLabel, status: 'green' as const }
					],
					bottomText: `Com base nas suas preferências alimentares e objetivo de **${goalType}**, seu cardápio será ajustado **milimetricamente** para funcionar dentro da sua rotina.`
				}
			};
		}
		default:
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →'
			};
	}
}
