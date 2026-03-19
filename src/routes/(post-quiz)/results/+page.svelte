<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { quizStore } from '$lib/stores/quiz.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import BodyBeforeAfterCard from '$lib/components/quiz/BodyBeforeAfterCard.svelte';
	import NutritionPlanCard from '$lib/components/quiz/NutritionPlanCard.svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import ResultsOffer from '$lib/components/result/ResultsOffer.svelte';
	import { calculateCalorieProfile, bodyFatPercentFromStage } from '$lib/utils/calories';
	import { BODY_FAT_LABELS } from '$lib/assets/body-fat-config';
	import { getRemaining, formatCountdown, TOTAL_SECONDS } from '$lib/stores/discount-countdown.store';

	const quiz = $derived($quizStore);
	const name = $derived(($postQuizStore.name || '').trim() || 'Você');

	// Seletor de planos
	const plans = [
		{ id: 'mensal',    label: 'Plano Pro - Mensal',    oldPrice: 197, price: 117, monthly: 17,  badge: null },
		{ id: 'semestral', label: 'Plano Pro - Semestral', oldPrice: 197, price: 117, monthly: 11,  badge: 'Mais Vendido' },
		{ id: 'anual',     label: 'Plano Pro - Anual',     oldPrice: 197, price: 117, monthly: 8,   badge: null }
	];
	let selectedPlan = $state('semestral');

	const currentKg = $derived.by(() => {
		const raw = quiz.answers['weight_current_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});
	const goalKg = $derived.by(() => {
		const raw = quiz.answers['weight_goal_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});
	const kgDelta = $derived.by(() => {
		if (currentKg == null || goalKg == null) return null;
		return Math.abs(currentKg - goalKg);
	});
	const isMassGoal = $derived(quiz.answers['goal_type'] === 'goal-massa');
	const actionVerb = $derived(isMassGoal ? 'ganhar massa' : 'emagrecer');
	/** Rótulo do objetivo no bloco “O que está incluso” */
	const planObjectiveLabel = $derived(isMassGoal ? 'ganhar massa' : 'emagrecer');

	const initials = $derived.by(() => {
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	});

	const gender = $derived(quiz.answers['gender'] as string | undefined);
	const sexo = $derived.by(() => (gender === 'gender-m' ? 'homem' : gender === 'gender-f' ? 'mulher' : ''));
	const age = $derived.by(() => {
		const raw = quiz.answers['age_years'];
		if (raw == null) return '';
		const n = typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(String(raw[0]), 10) : NaN;
		return Number.isFinite(n) ? String(n) : '';
	});

	// Melhorias Ativadas
	const isGlp1 = $derived(quiz.answers['weight_medication_use'] === 'med-glp1');
	const eventType = $derived(quiz.answers['event_type'] as string | undefined);
	const hasEvent = $derived(!!eventType && eventType !== 'event-nenhuma');
	const eventLabel = $derived.by(() => {
		const map: Record<string, string> = {
			'event-casamento':   'Casamento',
			'event-viagem':      'Viagem',
			'event-verao':       'Verão',
			'event-aniversario': 'Aniversário',
			'event-reencontro':  'Reencontro'
		};
		return map[eventType ?? ''] ?? 'evento';
	});
	const eventDateFormatted = $derived.by(() => {
		const raw = quiz.answers['event_date'];
		const str = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : null;
		if (!str || !String(str).trim()) return null;
		const d = new Date(String(str));
		if (!Number.isFinite(d.getTime())) return null;
		return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
	});
	const hasMelhorias = $derived(isGlp1 || hasEvent);

	/** Toggles “Melhorias Ativadas” (UI local) */
	let melhoriaGlp1On = $state(true);
	let melhoriaEventOn = $state(true);

	/** Mini-gráfico “Gráficos de evolução”: 9 barras com flutuação dia a dia (último dia em destaque) */
	const evolutionBarHeights = [0.52, 0.38, 0.62, 0.45, 0.7, 0.5, 0.68, 0.56, 1];

	/** Barra de calorias no thumb (igual NutritionPlanCard — meta ~2.254, ~91% preenchido) */
	const FEATURE_CAL_SEGMENTS = 10;
	const featureCalFilled = Math.min(FEATURE_CAL_SEGMENTS, Math.round(0.91 * FEATURE_CAL_SEGMENTS));
	function featureCalColorAt(ratio: number): string {
		if (ratio <= 0.6) return '#8ED33A';
		if (ratio <= 0.85) return '#B6E635';
		if (ratio <= 1) return '#F4E84A';
		if (ratio <= 1.15) return '#F7B23B';
		if (ratio <= 1.3) return '#F47A3A';
		return '#E84C3D';
	}
	function featureCalRatio(i: number) {
		return (i + 0.5) / FEATURE_CAL_SEGMENTS;
	}

	const bodyCurrentStage = $derived.by(() => {
		const raw = quiz.answers['body_current'];
		if (raw == null) return 3;
		const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
		return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 3;
	});

	const bodyGoalStage = $derived.by(() => {
		const raw = quiz.answers['body_goal_visual'];
		if (raw == null) return Math.max(0, bodyCurrentStage - 1);
		const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
		return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : Math.max(0, bodyCurrentStage - 1);
	});

	const includeBreakfast = $derived(quiz.answers['include_breakfast'] === 'ib-sim');
	const mealCount = $derived.by(() => {
		const raw = quiz.answers['meal_count'] as string | undefined;
		if (!raw) return 3;
		const n = parseInt(raw.replace('mc-', ''), 10);
		return Number.isFinite(n) ? n : 3;
	});

	const calorieProfile = $derived(calculateCalorieProfile(quiz.answers));
	/** Gordura corporal atual exibida: baseada no estágio escolhido pelo usuário, para ficar próxima da expectativa (não Deurenberg). */
	const currentBfPercent = $derived(bodyFatPercentFromStage(bodyCurrentStage, gender));
	const goalBfPercent = $derived(bodyFatPercentFromStage(bodyGoalStage, gender));

	const steps = $derived([
		{ title: 'Passo 1:', desc: null },
		{ title: 'Passo 2:', desc: 'Registre suas refeições como preferir. Foto, áudio ou texto. Qualquer alimento, qualquer hora do dia.' },
		{ title: 'Passo 3:', desc: 'Acompanhe tudo direto no WhatsApp. Calorias, macros e progresso atualizados em tempo real.' }
	]);

	$effect(() => {
		if (!browser) return;
		if ($quizStore.completedAt == null) {
			goto('/', { replaceState: true });
		}
	});

	const ALL_TESTIMONIALS = [
		{ user: 'ana_fitness',  prevKg: 98,  currKg: 75 },
		{ user: 'marcos_s',     prevKg: 112, currKg: 89 },
		{ user: 'julia_r',      prevKg: 78,  currKg: 61 },
		{ user: 'roberto_m',    prevKg: 95,  currKg: 78 },
		{ user: 'camila_t',     prevKg: 72,  currKg: 63 },
		{ user: 'thiago_b',     prevKg: 88,  currKg: 76 },
		{ user: 'patricia_m',   prevKg: 105, currKg: 87 },
		{ user: 'gabriel_c',    prevKg: 130, currKg: 108 },
	];
	const testimonials = $derived.by(() => {
		if (kgDelta == null || isMassGoal) return ALL_TESTIMONIALS.slice(0, 4);
		return [...ALL_TESTIMONIALS]
			.sort((a, b) => {
				const da = Math.abs((a.prevKg - a.currKg) - kgDelta);
				const db = Math.abs((b.prevKg - b.currKg) - kgDelta);
				return da - db;
			})
			.slice(0, 4);
	});
	const appScreens: { src: string; label: number }[] = [
		{ src: '/assets/zuppy-screen-8.png', label: 8 },
		{ src: '/assets/zuppy-screen-1.png', label: 1 },
		{ src: '/assets/zuppy-screen-2.png', label: 2 },
		{ src: '/assets/zuppy-screen-3.png', label: 3 },
		{ src: '/assets/zuppy-screen-4.png', label: 4 },
		{ src: '/assets/zuppy-screen-5.png', label: 5 },
		{ src: '/assets/zuppy-screen-6.png', label: 6 },
		{ src: '/assets/zuppy-screen-7.png', label: 7 },
	];
	const faqs = $derived.by(() => {
		const firstQ = isMassGoal
			? { q: 'Como o Zuppy vai me ajudar a ganhar massa?', a: 'O Zuppy calcula exatamente o superávit calórico necessário para você ganhar músculo sem acumular gordura desnecessária. Você registra suas refeições pelo WhatsApp e ele garante que está batendo a proteína e as calorias certas todo dia.' }
			: { q: 'Como o Zuppy vai me ajudar a emagrecer?', a: 'O Zuppy calcula exatamente quantas calorias você precisa consumir por dia para chegar no seu objetivo e te ajuda a manter esse controle de forma simples, direto no WhatsApp. Sem dieta maluca, sem passar fome.' };
		return [
			firstQ,
			{ q: 'Preciso baixar algum aplicativo?', a: 'Não. O Zuppy funciona 100% pelo WhatsApp. Você conecta uma vez e pronto. Sem instalar nada, sem criar conta em plataforma nova.' },
			{ q: 'Como funciona o registro de refeições na prática?', a: 'É só mandar uma mensagem. Foto do prato, áudio falando o que comeu, ou texto mesmo. O Zuppy identifica o alimento, calcula as calorias e atualiza seu saldo do dia na hora.' },
			{ q: 'O plano é realmente personalizado ou é genérico?', a: `É personalizado com base nas suas respostas do quiz: peso, altura, rotina e objetivo. Não é uma dieta padrão. É o seu número — <strong class="text-nutrition-green">${calorieProfile.caloriasMeta.toLocaleString('pt-BR')} kcal/dia</strong>, calculado pro seu corpo.` },
			{ q: 'E se eu não tiver tempo de registrar tudo?', a: 'Esse é exatamente o ponto. Registrar pelo WhatsApp leva menos de 10 segundos. Você manda uma foto e pronto. Sem planilha, sem app complicado.' },
			{ q: 'Como acesso meu plano depois que ativar?', a: 'Assim que o pagamento for aprovado, você recebe um e-mail e uma mensagem no WhatsApp com todas as instruções para acessar seu plano e começar na hora.' },
		];
	});
	let openFaq = $state<number | null>(null);
	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
	}

	let appSliderEl = $state<HTMLDivElement | null>(null);
	let activeAppSlide = $state(1);
	let appSliderInitialScrollDone = false;

	/** Cronômetro da oferta (mesmo do banner no topo). */
	let countdownRemaining = $state(TOTAL_SECONDS);
	$effect(() => {
		const unsub = getRemaining().subscribe((v) => (countdownRemaining = v));
		return unsub;
	});
	const countdownDisplay = $derived.by(() => formatCountdown(countdownRemaining));

	/** Sempre abre o carrossel “Veja o Zuppy por dentro” no 2º slide */
	$effect(() => {
		if (!browser || !appSliderEl || appSliderInitialScrollDone || appScreens.length < 2) return;
		const el = appSliderEl;
		const snapToSecond = () => {
			const unit = el.scrollWidth / appScreens.length;
			if (unit <= 0) {
				requestAnimationFrame(snapToSecond);
				return;
			}
			el.scrollTo({ left: unit, behavior: 'auto' });
			activeAppSlide = 1;
			appSliderInitialScrollDone = true;
		};
		requestAnimationFrame(() => requestAnimationFrame(snapToSecond));
	});

	function onAppSliderScroll() {
		if (!appSliderEl) return;
		const cardW = appSliderEl.scrollWidth / appScreens.length;
		activeAppSlide = Math.round(appSliderEl.scrollLeft / cardW);
	}
	function goToAppSlide(i: number) {
		if (!appSliderEl) return;
		const cardW = appSliderEl.scrollWidth / appScreens.length;
		appSliderEl.scrollTo({ left: i * cardW, behavior: 'smooth' });
	}

	let testimonialSliderEl = $state<HTMLDivElement | null>(null);
	let activeTestimonial = $state(0);
	function onTestimonialScroll() {
		if (!testimonialSliderEl) return;
		const cardW = testimonialSliderEl.scrollWidth / testimonials.length;
		activeTestimonial = Math.round(testimonialSliderEl.scrollLeft / cardW);
	}
	function goToTestimonial(i: number) {
		if (!testimonialSliderEl) return;
		const cardW = testimonialSliderEl.scrollWidth / testimonials.length;
		testimonialSliderEl.scrollTo({ left: i * cardW, behavior: 'smooth' });
	}

	function scrollToOffer() {
		if (typeof document === 'undefined') return;
		document.getElementById('offer-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head>
	<title>Seus Resultados | Zuppy</title>
</svelte:head>

<div class="flex flex-col items-center justify-center text-center pt-0 pb-8">
	<h1
		class="max-w-[22rem] text-2xl font-extrabold leading-[24px] tracking-tight text-heading sm:max-w-md sm:text-[1.65rem]"
	>
		<span class="text-nutrition-green">{name}</span>, seu plano personalizado para <span class="text-nutrition-green">{actionVerb}</span>
		{#if !isMassGoal}
			até
			{#if kgDelta != null && kgDelta > 0}
				<span class="text-nutrition-green">{kgDelta}kg</span>
			{:else}
				<span class="text-nutrition-green">…kg</span>
			{/if}
		{/if}
		está pronto.
	</h1>
	<p class="mt-3 max-w-[22rem] text-sm text-muted leading-relaxed sm:max-w-md">
		Agora você só precisa ativar para começar.
	</p>
</div>

<div class="w-full max-w-sm mx-auto px-4 pb-4 results-content">
	<BodyBeforeAfterCard
		currentStage={bodyCurrentStage}
		goalStage={bodyGoalStage}
		{gender}
		{currentBfPercent}
		{goalBfPercent}
	/>
	<NutritionPlanCard
		{includeBreakfast}
		{mealCount}
		caloriasMeta={calorieProfile.caloriasMeta}
		deficitCalorico={calorieProfile.deficitCalorico}
		proteinaG={calorieProfile.proteinaG}
		carboidratoG={calorieProfile.carboidratoG}
		gorduraG={calorieProfile.gorduraG}
		fibraG={calorieProfile.fibraG}
		scrollToOffer={scrollToOffer}
	/>

	<!-- Social proof -->
	<div class="mt-4 flex items-center gap-3 border border-line rounded-full px-4 py-2.5">
		<AvatarStack {initials} max={3} size="sm" variant="default" />
		<p class="text-xs text-muted leading-tight">
			Mais de <span class="font-bold text-heading">15.000</span> pessoas já <span class="font-bold text-heading">emagreceram</span> enviando uma foto no <span class="font-bold text-heading">WhatsApp</span>.
		</p>
	</div>

	<ResultsOffer bind:selectedPlan {plans} {actionVerb} {planObjectiveLabel} {name} {sexo} {age} objetivo={planObjectiveLabel} />

	<!-- O que está incluso -->
	<div class="mt-2 pb-10">
		<h2 class="text-2xl font-extrabold text-heading leading-none text-center mb-1">
			O que você recebe no seu<br>plano para <span class="text-nutrition-green">{planObjectiveLabel}</span>
		</h2>
		<p class="text-sm text-muted text-center mb-6">
			Tudo que você precisa para chegar nos
			{#if goalKg != null}
				<span class="text-nutrition-green font-semibold">{goalKg}kg</span>
			{:else}
				<span class="text-nutrition-green font-semibold">…kg</span>
			{/if}
			em um único lugar.
		</p>

		<div class="flex flex-col gap-4">
			<!-- Item 1 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex min-w-0 flex-col justify-end p-2">
					<div class="feature-cal-bar mb-[15px] flex h-[15px] w-full min-w-0 max-w-full gap-[2px]">
						{#each Array(FEATURE_CAL_SEGMENTS) as _, i}
							<div
								class="feature-cal-bar__seg"
								class:feature-cal-bar__seg--empty={i >= featureCalFilled}
								style={i < featureCalFilled
									? `background-color: ${featureCalColorAt(featureCalRatio(i))}`
									: undefined}
							></div>
						{/each}
					</div>
					<p class="text-[11px] font-bold text-heading leading-none">{calorieProfile.caloriasMeta.toLocaleString('pt-BR')}</p>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1 leading-[14px]">Plano completo de calorias e macros</p>
					<p class="text-xs text-muted leading-[12px]">Sua meta de <span class="text-nutrition-green font-bold">{calorieProfile.caloriasMeta.toLocaleString('pt-BR')} kcal</span> calculada pro seu corpo e ajustada automaticamente conforme você evolui.</p>
				</div>
			</div>

			<!-- Item 2 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex flex-col items-center justify-end p-3">
					<div class="flex items-center justify-center gap-1.5">
						<i class="fa-solid fa-check text-nutrition-green text-[11px] shrink-0"></i>
						<p class="text-[11px] font-medium text-heading leading-none">1 Pizza</p>
					</div>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1">Controle no WhatsApp <i class="fa-brands fa-whatsapp text-green-500"></i></p>
					<p class="text-xs text-muted leading-[12px]">Registre qualquer refeição com apenas uma foto, áudio ou texto no seu WhatsApp de uma maneira super rápida.</p>
				</div>
			</div>

			<!-- Item 3 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex flex-col items-start justify-end p-3">
					<p class="text-[9px] text-muted mb-1">12:15 PM</p>
					<p class="whitespace-nowrap text-[8px] font-bold text-heading leading-none">
						<i class="fa-solid fa-fire text-nutrition-green text-[7px]"></i> {Math.round(calorieProfile.caloriasMeta / mealCount)} kcal
					</p>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1 flex items-center gap-0.5 flex-wrap">
						<span class="whitespace-nowrap">Cardápio diário para {actionVerb}</span>
						<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600 shrink-0" title="Presente" aria-hidden="true">
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
						</span>
						<span class="text-xs font-bold tabular-nums text-red-500 shrink-0">{countdownDisplay}</span>
					</p>
					<p class="text-xs text-muted leading-[12px]">Sugestões de refeições dentro da sua meta de <span class="text-nutrition-green font-bold">{calorieProfile.caloriasMeta.toLocaleString('pt-BR')} kcal</span> em <span class="text-nutrition-green font-bold">{mealCount} refeições</span> ao longo do dia. Você não precisa pensar, só seguir.</p>
				</div>
			</div>

			<!-- Item 4 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex flex-col justify-end p-2">
					<svg viewBox="0 0 80 40" class="w-full mb-1" fill="none">
						<path
							d="M4 9 L11 15 L17 11 L24 18 L30 13 L37 21 L43 16 L50 24 L56 19 L63 27 L69 22 L76 33"
							stroke="#8ED33A"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							fill="none"
						/>
					</svg>
					<p class="text-[11px] font-bold text-heading leading-none">{BODY_FAT_LABELS[bodyGoalStage]}</p>
					<p class="text-[8px] text-muted">% Gordura</p>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1 flex items-center gap-0.5 flex-wrap">
						<span class="whitespace-nowrap">Análise corporal por foto</span>
						<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600 shrink-0" title="Presente" aria-hidden="true">
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
						</span>
						<span class="text-xs font-bold tabular-nums text-red-500 shrink-0">{countdownDisplay}</span>
					</p>
					<p class="text-xs text-muted leading-[12px]">Envie fotos e veja a mudança acontecendo em direção aos <span class="text-nutrition-green font-bold">{BODY_FAT_LABELS[bodyGoalStage]}</span> de gordura. Não só números na balança e receba dicas.</p>
				</div>
			</div>

			<!-- Item 5 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex flex-col items-start justify-end p-3">
					<p class="text-[14px] font-bold text-heading leading-none mb-1.5">{currentKg != null ? currentKg + ' kg' : '…'}</p>
					<div class="flex w-full items-end gap-0.5 h-7 min-h-[28px]">
						{#each evolutionBarHeights as h, i}
							<div
								class="min-w-0 flex-1 rounded-[2px] {i === evolutionBarHeights.length - 1
									? 'bg-nutrition-green'
									: 'bg-[#D1D1D6]'}"
								style="height:{h * 100}%"
							></div>
						{/each}
					</div>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1">Gráficos de evolução</p>
					<p class="text-xs text-muted leading-[12px]">
						Peso, calorias e macros, performance nutricional, você consegue acompanhar toda sua jornada de <span class="text-nutrition-green font-bold">{currentKg ?? '…'}kg</span> até <span class="text-nutrition-green font-bold">{goalKg ?? '…'}kg</span>, em tempo real.
					</p>
				</div>
			</div>

			<!-- Item 6 -->
			<div class="flex items-center gap-4">
				<div class="feature-thumb shrink-0 flex flex-col items-center justify-center p-3 text-center">
					<p class="w-full text-center text-[12px] font-semibold text-heading leading-tight">Pizza</p>
					<p
						class="mt-1 flex w-full items-center justify-center gap-0.5 text-[7px] font-medium leading-none text-muted"
					>
						<i class="fa-solid fa-fire shrink-0 text-nutrition-green text-[6px]"></i>
						<span>480 kcal</span>
					</p>
				</div>
				<div>
					<p class="text-sm font-bold text-heading mb-1">Assistente de refeições</p>
					<p class="text-xs text-muted leading-[12px]">Peça essa receita no seu WhatsApp, com base no que você tem em casa e nas calorias que ainda sobram no dia para você ficar em déficit calórico.</p>
				</div>
			</div>
		</div>

		<!-- Melhorias Ativadas (condicional): só linhas em cima/baixo, sem box -->
		{#if hasMelhorias}
		<div class="mt-6 border-t border-b border-line py-4">
			<p class="text-xs text-muted mb-3">Melhorias Ativadas</p>
			<div class="flex flex-col gap-4">
				{#if isGlp1}
				<div class="flex items-start gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={melhoriaGlp1On}
						aria-label="Ativar adaptação GLP-1"
						onclick={() => (melhoriaGlp1On = !melhoriaGlp1On)}
						class="shrink-0 mt-0.5 w-10 h-6 rounded-full flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-heading focus-visible:ring-offset-2"
						class:bg-nutrition-green={melhoriaGlp1On}
						class:justify-end={melhoriaGlp1On}
						class:pr-1={melhoriaGlp1On}
						class:bg-[#C7C7CC]={!melhoriaGlp1On}
						class:justify-start={!melhoriaGlp1On}
						class:pl-1={!melhoriaGlp1On}
					>
						<span class="w-4 h-4 rounded-full bg-white shadow pointer-events-none"></span>
					</button>
					<div class="min-w-0 flex-1 transition-opacity" class:opacity-50={!melhoriaGlp1On}>
						<p class="text-xs font-bold text-heading leading-none mb-1">Adaptado para uso de GLP-1</p>
						<p class="text-xs text-muted leading-[12px]">Plano ajustado para quem usa Ozempic ou Mounjaro com foco em preservar músculo enquanto emagrece.</p>
					</div>
				</div>
				{/if}
				{#if hasEvent}
				<div class="flex items-start gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={melhoriaEventOn}
						aria-label="Ativar aceleradores para {eventLabel}"
						onclick={() => (melhoriaEventOn = !melhoriaEventOn)}
						class="shrink-0 mt-0.5 w-10 h-6 rounded-full flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-heading focus-visible:ring-offset-2"
						class:bg-nutrition-green={melhoriaEventOn}
						class:justify-end={melhoriaEventOn}
						class:pr-1={melhoriaEventOn}
						class:bg-[#C7C7CC]={!melhoriaEventOn}
						class:justify-start={!melhoriaEventOn}
						class:pl-1={!melhoriaEventOn}
					>
						<span class="w-4 h-4 rounded-full bg-white shadow pointer-events-none"></span>
					</button>
					<div class="min-w-0 flex-1 transition-opacity" class:opacity-50={!melhoriaEventOn}>
						<p class="text-xs font-bold text-heading leading-none mb-1">Aceleradores para {eventLabel}</p>
						<p class="text-xs text-muted leading-[12px]">Você tem <span class="text-nutrition-green font-bold">{eventLabel}</span> chegando. O Zuppy calculou exatamente o que precisa fazer para chegar bem no dia{#if eventDateFormatted}{' '}(<span class="text-nutrition-green font-bold">{eventDateFormatted}</span>){/if}.</p>
					</div>
				</div>
				{/if}
			</div>
		</div>
		{/if}

		<!-- Sem app novo -->
		<div class="mt-8 text-center">
			<h2 class="text-2xl font-extrabold text-heading leading-none mb-2">
				Sem app novo. Sem aprender nada. Sem complicação para <span class="text-nutrition-green">{planObjectiveLabel}.</span>
			</h2>
			<p class="text-sm text-muted leading-[12px] mb-8">Você já usa o WhatsApp, o Zuppy só se encaixa na sua rotina.</p>

			<div class="flex flex-col gap-0 text-left">
				{#each steps as step, i}
				<div class="flex gap-4">
					<!-- Círculo + linha -->
					<div class="flex flex-col items-center shrink-0">
						<div class="w-7 h-7 rounded-full bg-[#E8E8ED] flex items-center justify-center shrink-0">
							{#if i === 0}
								<div class="step-pulse w-3 h-3 rounded-full bg-nutrition-green"></div>
							{/if}
						</div>
						{#if i < 2}
							<div class="w-px flex-1 bg-line my-1"></div>
						{/if}
					</div>
					<!-- Conteúdo -->
					<div class="pb-8 pt-1">
						<p class="text-sm font-bold text-heading leading-none mb-1">{step.title}</p>
						{#if i === 0}
							<p class="text-xs text-muted leading-[12px]">Conecte seu WhatsApp ao Zuppy. Em menos de 1 minuto, seu plano de <strong class="text-nutrition-green">{calorieProfile.caloriasMeta.toLocaleString('pt-BR')} kcal</strong> já está ativo e pronto pra usar.</p>
						{:else}
							<p class="text-xs text-muted leading-[12px]">{@html step.desc}</p>
						{/if}
					</div>
				</div>
				{/each}
			</div>
		</div>

		<!-- Social proof final -->
		<div class="mt-4 text-center">
			<p class="text-2xl font-extrabold text-heading leading-none">
				Mais de <span class="text-nutrition-green">15.000 pessoas</span> já estão usando o <span class="text-nutrition-green">Zuppy</span> para <span class="text-nutrition-green">{planObjectiveLabel}</span> enviando uma foto no WhatsApp.
			</p>
		</div>

		<!-- Testimonial cards (Instagram-style) -->
		<div class="mt-6 pb-4">
			<div
				bind:this={testimonialSliderEl}
				onscroll={onTestimonialScroll}
				class="flex overflow-x-auto gap-3 no-testimonial-scrollbar -mx-4 px-4"
				style="scroll-snap-type: x mandatory;"
			>
				{#each testimonials as t, ti}
					<div
						class="bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm"
						style="width: calc(92% - 0.5rem); scroll-snap-align: start;"
					>
						<!-- Header: avatar ring + username -->
						<div class="flex items-center gap-2.5 px-3 py-3">
							<svg width="36" height="36" viewBox="0 0 36 36" class="shrink-0" aria-hidden="true">
								<defs>
									<linearGradient id="ig-ring-{ti}" x1="0%" y1="100%" x2="100%" y2="0%">
										<stop offset="0%" stop-color="#f09433" />
										<stop offset="40%" stop-color="#dc2743" />
										<stop offset="100%" stop-color="#bc1888" />
									</linearGradient>
								</defs>
								<circle cx="18" cy="18" r="16" fill="none" stroke="url(#ig-ring-{ti})" stroke-width="2.5" />
								<circle cx="18" cy="18" r="12" fill="#D1D1D6" />
							</svg>
							<span class="text-sm font-medium text-heading truncate">{t.user}</span>
						</div>

						<!-- Image placeholder -->
						<div class="w-full bg-[#AEAEB2] aspect-square"></div>

						<!-- Stats -->
						<div class="flex border-t border-line">
							<div class="flex-1 px-3 py-3">
								<p class="text-[10px] text-muted mb-0.5">Peso anterior</p>
								<p class="text-sm font-bold text-heading">{t.prevKg}Kg</p>
							</div>
							<div class="w-px bg-line"></div>
							<div class="flex-1 px-3 py-3">
								<p class="text-[10px] text-muted mb-0.5">Peso atual</p>
								<p class="text-sm font-bold text-heading">{t.currKg}Kg</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Dots -->
			<div class="flex justify-center gap-1.5 mt-3">
				{#each testimonials as _, i}
					<button
						onclick={() => goToTestimonial(i)}
						aria-label="Ver depoimento {i + 1}"
						class="rounded-full transition-all duration-200 {activeTestimonial === i ? 'w-2 h-2 bg-heading' : 'w-1.5 h-1.5 bg-[#D1D1D6]'}"
					></button>
				{/each}
			</div>
		</div>

		<ResultsOffer bind:selectedPlan {plans} {actionVerb} class="mt-6" />

		<!-- Veja o Zuppy por dentro -->
		<div class="mt-10">
			<h2 class="text-2xl font-extrabold text-heading leading-tight mb-2 text-center">
				Veja o Zuppy por dentro.
			</h2>
			<p class="text-sm text-muted leading-[14px] mb-5 text-center">
				Simples, direto e tudo no WhatsApp. Sem baixar nada, já funciona no app que você usa todo dia.
			</p>

			<div class="relative -mx-4 app-carousel-fixed">
				<!-- Fade esquerda -->
				<div class="absolute left-0 top-0 bottom-0 w-[14%] z-10 pointer-events-none" style="background: linear-gradient(to right, color-mix(in srgb, var(--color-bg) 60%, transparent), transparent);"></div>
				<!-- Fade direita -->
				<div class="absolute right-0 top-0 bottom-0 w-[14%] z-10 pointer-events-none" style="background: linear-gradient(to left, color-mix(in srgb, var(--color-bg) 60%, transparent), transparent);"></div>

				<div
					bind:this={appSliderEl}
					onscroll={onAppSliderScroll}
					class="flex overflow-x-auto gap-3 no-testimonial-scrollbar app-carousel-inner"
					style="scroll-snap-type: x mandatory; padding-inline: 14%; box-sizing: border-box; touch-action: pan-x;"
				>
					{#each appScreens as screen, i}
						<div
							class="shrink-0 rounded-2xl overflow-hidden transition-all duration-300"
							style="width: calc(72% - 0.5rem); scroll-snap-align: center; opacity: {activeAppSlide === i ? 1 : 0.2}; transform: scale({activeAppSlide === i ? 1.04 : 1}); transform-origin: center;"
						>
							<img
								src={screen.src}
								alt="Zuppy app - tela {screen.label}"
								class="w-full h-auto block"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Dots -->
			<div class="flex justify-center gap-1.5 mt-3 pb-4">
				{#each appScreens as screen, i}
					<button
						onclick={() => goToAppSlide(i)}
						aria-label="Ver tela {screen.label}"
						class="rounded-full transition-all duration-200 {activeAppSlide === i ? 'w-2 h-2 bg-heading' : 'w-1.5 h-1.5 bg-[#D1D1D6]'}"
					></button>
				{/each}
			</div>
		</div>

		<!-- FAQ -->
		<div class="mt-10 pb-6">
			<h2 class="text-2xl font-extrabold text-heading leading-none mb-1 text-center">
				Ainda tem dúvidas?
			</h2>
			<p class="text-sm text-muted leading-none mb-5 text-center">
				A gente separou as 6 perguntas mais frequentes.
			</p>

			<div class="flex flex-col">
				{#each faqs as faq, i}
					<div class="border-t border-line">
						<button
							type="button"
							onclick={() => toggleFaq(i)}
							class="w-full flex items-center justify-between gap-3 py-4 text-left"
							aria-expanded={openFaq === i}
						>
							<span class="text-sm font-semibold text-heading leading-none">{i + 1}. {faq.q}</span>
							<i
								class="fa-solid fa-chevron-down text-muted text-xs shrink-0 transition-transform duration-200"
								style="transform: rotate({openFaq === i ? '180deg' : '0deg'})"
								aria-hidden="true"
							></i>
						</button>
						{#if openFaq === i}
							<p class="text-sm text-muted leading-none pb-4">{@html faq.a}</p>
						{/if}
					</div>
				{/each}
				<div class="border-t border-line"></div>
			</div>
		</div>

		<!-- Disclaimer -->
		<div class="mt-6 flex gap-3 p-4 rounded-2xl bg-[#fffbeb] border border-amber-200">
			<i class="fa-solid fa-triangle-exclamation text-amber-600 text-lg shrink-0 mt-0.5" aria-hidden="true"></i>
			<p class="text-xs text-amber-900/90 leading-[14px]">
				O Zuppy é uma ferramenta de apoio ao controle alimentar e não substitui o acompanhamento de médicos, nutricionistas ou outros profissionais de saúde. Os resultados podem variar de pessoa para pessoa. Consulte um profissional de saúde antes de iniciar qualquer programa de emagrecimento.
			</p>
		</div>

	<!-- Footer -->
	<footer class="mt-2.5 shrink-0 pb-6 px-4 border-t border-line pt-6">
		<p class="text-[10px] text-muted/60 leading-none mb-1">© 2026 Zuppy. Todos os direitos reservados.</p>
		<p class="text-[10px] text-muted/60 leading-none mb-4">CNPJ: 46.737.539/0001-29</p>

		<p class="text-[10px] text-muted/60 leading-relaxed mb-4">
			Este site não é afiliado ao Facebook™, Google™ ou qualquer plataforma de mídia. Após sair dessas plataformas, a responsabilidade é exclusivamente deste site.
		</p>

		<p class="text-[10px] text-muted/60 leading-relaxed mb-4">
			Os resultados podem variar de pessoa para pessoa. As informações disponibilizadas possuem caráter educativo e não substituem orientação médica ou profissional.
		</p>

		<p class="text-[10px] text-muted/60 leading-relaxed mb-5">
			Ao utilizar este site você concorda com nossos Termos de Uso e Política de Privacidade.
		</p>

		<div class="flex flex-wrap gap-x-3 gap-y-1">
			<a href="https://zuppy.me/terms/use" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Termos de Uso</a>
			<span class="text-[10px] text-muted/30">|</span>
			<a href="https://zuppy.me/terms/privacy" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Política de Privacidade</a>
			<span class="text-[10px] text-muted/30">|</span>
			<a href="https://zuppy.me/terms/subscription" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Política de Assinatura</a>
			<span class="text-[10px] text-muted/30">|</span>
			<a href="https://zuppy.me/terms/refund" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Garantia de Reembolso</a>
			<span class="text-[10px] text-muted/30">|</span>
			<a href="mailto:rodrigo@zuppy.me" class="text-[10px] text-muted/50 hover:text-muted transition-colors">rodrigo@zuppy.me</a>
		</div>
	</footer>
</div>
</div>

<style>
	/* Line-height 14px for all 12px (text-xs) copy on this page */
	.results-content :global(.text-xs) {
		line-height: 14px;
	}
	/* Line-height 16px for all 14px (text-sm) copy on this page */
	.results-content :global(.text-sm) {
		line-height: 16px;
	}

	.feature-thumb {
		width: 80px;
		height: 80px;
		background: #ffffff;
		border-radius: 14px;
		box-shadow: 0 1px 4px rgba(0,0,0,0.06);
	}

	/* Mesmo padrão visual de .nutrition-cal-bar (NutritionPlanCard) */
	.feature-cal-bar__seg {
		flex: 1 1 0;
		min-width: 0;
		height: 100%;
		border-radius: 2px;
	}
	.feature-cal-bar__seg--empty {
		background-color: #f7f6f9;
	}

	.no-testimonial-scrollbar::-webkit-scrollbar { display: none; }
	.no-testimonial-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

	/* Carrossel "Veja o Zuppy por dentro" — dimensões fixas para evitar zoom/reflow */
	.app-carousel-fixed {
		width: min(341px, 100%);
		height: 332px;
		margin-inline: auto;
		overflow: hidden;
	}
	.app-carousel-inner {
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	@keyframes step-pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(142, 211, 58, 0.5); }
		50% { box-shadow: 0 0 0 6px rgba(142, 211, 58, 0); }
	}
	.step-pulse {
		animation: step-pulse 2s ease-in-out infinite;
	}
</style>
