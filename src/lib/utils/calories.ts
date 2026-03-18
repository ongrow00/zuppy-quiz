import type { Answers } from '$lib/data/types';

/**
 * Midpoints de gordura corporal por estágio (0–5) e gênero.
 * Machos: baseado nos BODY_FAT_LABELS existentes.
 * Fêmeas: equivalentes fisiológicos (mulheres têm ~6–8 pp a mais de gordura essencial).
 */
const BF_MIDPOINTS: Record<'m' | 'f', readonly number[]> = {
	m: [12, 14, 17, 22, 27, 35],
	f: [19, 22, 25, 30, 35, 41]
};

/**
 * Estima o percentual de gordura corporal atual usando a fórmula de Deurenberg
 * (BF% = 1.20×IMC + 0.23×idade − 10.8×sexo − 5.4), onde sexo = 1 (H) ou 0 (M).
 * Retorna null se os dados necessários estiverem ausentes.
 */
export function estimateBodyFatPercent(answers: Answers): number | null {
	const gender = answers['gender'] as string | undefined;
	const weight = parseNum(answers['weight_current_kg']);
	const height = parseNum(answers['height_cm']);
	const age = parseNum(answers['age_years']);

	if (!Number.isFinite(weight) || !Number.isFinite(height) || !Number.isFinite(age)) return null;
	if (height <= 0 || weight <= 0) return null;

	const bmi = weight / ((height / 100) ** 2);
	const sex = gender === 'gender-m' ? 1 : 0;
	const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
	return Math.max(3, Math.round(bf));
}

/**
 * Retorna o percentual estimado de gordura para um estágio visual (0–5)
 * ajustado por gênero (midpoint da faixa típica para aquele estágio).
 */
export function bodyFatPercentFromStage(stage: number, gender: string | undefined): number {
	const key: 'm' | 'f' = gender === 'gender-f' ? 'f' : 'm';
	const clamped = Math.min(5, Math.max(0, Math.round(stage)));
	return BF_MIDPOINTS[key][clamped];
}

export interface CalorieProfile {
	/** Taxa Metabólica Basal — Mifflin-St Jeor (kcal/dia) */
	tmb: number;
	/** Gasto Energético Total Diário com fator de atividade aplicado */
	tdee: number;
	/** Meta calórica diária (TDEE ± déficit/superávit) */
	caloriasMeta: number;
	/**
	 * Déficit calórico diário em kcal.
	 * Positivo = restrição (emagrecimento); negativo = superávit (ganho de massa).
	 */
	deficitCalorico: number;
	/** Macros em gramas */
	proteinaG: number;
	carboidratoG: number;
	gorduraG: number;
	fibraG: number;
}

/** Fator de atividade (equação de Harris-Benedict adaptada / TDEE padrão) */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
	'al-sedentario': 1.2,   // Pouco ou nenhum exercício
	'al-leve': 1.375,        // Leve: 1-3 dias/semana
	'al-moderado': 1.55,     // Moderado: 3-5 dias/semana
	'al-ativo': 1.725        // Intenso: 6-7 dias/semana
};

function parseNum(val: string | string[] | undefined): number {
	if (val == null) return NaN;
	const s = Array.isArray(val) ? val[0] : val;
	return parseFloat(s);
}

/**
 * Calcula TMB pela equação de Mifflin-St Jeor (a mais validada clinicamente),
 * aplica o fator de atividade para obter o TDEE, e define a meta calórica com
 * base no objetivo (emagrecimento com déficit seguro ou ganho de massa com
 * superávit moderado). Macros são distribuídos proporcionalmente.
 */
export function calculateCalorieProfile(answers: Answers): CalorieProfile {
	const gender = answers['gender'] as string | undefined;
	const age = parseNum(answers['age_years']);
	const height = parseNum(answers['height_cm']);
	const weight = parseNum(answers['weight_current_kg']);
	const activityLevel = answers['activity_level'] as string | undefined;
	const goalType = answers['goal_type'] as string | undefined;
	const isMassGoal = goalType === 'goal-massa';
	const isGlp1 = answers['weight_medication_use'] === 'med-glp1';
	const healthConditions = (answers['health_conditions'] ?? []) as string[];
	const hasHypothyroidism = healthConditions.includes('hc-hipotireoidismo');
	const isFemale = gender === 'gender-f';

	// ── TMB — Mifflin-St Jeor ────────────────────────────────────────────────
	// Homens : TMB = (10 × kg) + (6.25 × cm) − (5 × anos) + 5
	// Mulheres: TMB = (10 × kg) + (6.25 × cm) − (5 × anos) − 161
	let tmb: number;
	if (!Number.isFinite(weight) || !Number.isFinite(height) || !Number.isFinite(age)) {
		// Fallback conservador quando dados estão ausentes
		tmb = isFemale ? 1450 : 1800;
	} else {
		tmb = 10 * weight + 6.25 * height - 5 * age + (isFemale ? -161 : 5);
	}

	// Hipotireoidismo reduz o metabolismo basal ~10%
	if (hasHypothyroidism) {
		tmb *= 0.9;
	}

	// ── TDEE ─────────────────────────────────────────────────────────────────
	const multiplier = ACTIVITY_MULTIPLIERS[activityLevel ?? ''] ?? 1.375;
	const tdee = tmb * multiplier;

	// ── Meta calórica ─────────────────────────────────────────────────────────
	let deficitCalorico: number;
	let caloriasMeta: number;
	const minKcal = isFemale ? 1200 : 1500; // Limites seguros de ingestão mínima

	if (isMassGoal) {
		// Superávit moderado para hipertrofia (+300 kcal): maximiza ganho muscular
		// com acúmulo mínimo de gordura
		deficitCalorico = -300;
		caloriasMeta = Math.round(tdee + 300);
	} else {
		// Emagrecimento: déficit de 500 kcal/dia ≈ 0,5 kg/semana (recomendação padrão)
		// Para usuários de GLP-1: déficit mais conservador (300 kcal) pois o medicamento
		// já reduz a ingestão calórica espontânea
		deficitCalorico = isGlp1 ? 300 : 500;
		caloriasMeta = Math.max(minKcal, Math.round(tdee - deficitCalorico));
	}

	// ── Macros ───────────────────────────────────────────────────────────────
	// Proteína: 2 g/kg de peso corporal — preserva/constrói massa muscular
	const proteinaG = Number.isFinite(weight)
		? Math.round(weight * 2)
		: Math.round((caloriasMeta * 0.3) / 4);
	const proteinaKcal = proteinaG * 4;

	// Gordura: 25% das calorias totais — saúde hormonal e saciedade
	const gorduraKcal = Math.round(caloriasMeta * 0.25);
	const gorduraG = Math.round(gorduraKcal / 9);

	// Carboidratos: calorias restantes — energia e desempenho
	const carbKcal = Math.max(0, caloriasMeta - proteinaKcal - gorduraKcal);
	const carboidratoG = Math.round(carbKcal / 4);

	// Fibra: 14 g por 1.000 kcal (DRI — Dietary Reference Intake)
	const fibraG = Math.round((caloriasMeta / 1000) * 14);

	return {
		tmb: Math.round(tmb),
		tdee: Math.round(tdee),
		caloriasMeta,
		deficitCalorico,
		proteinaG,
		carboidratoG,
		gorduraG,
		fibraG
	};
}
