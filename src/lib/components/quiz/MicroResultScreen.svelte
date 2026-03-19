<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Question } from '$lib/data/types';
	import type { Answers } from '$lib/data/types';
	import {
		getMicroResultData,
		type NexoCentralizadaMr1,
		type NexoCentralizadaMr2,
		type NexoCentralizadaMr3,
	} from '$lib/utils/microresult-data';
	import { quizConfig } from '$lib/data/quiz.config';
	import BodyRadarChart from './BodyRadarChart.svelte';
	import ProtocolComparisonChart from './ProtocolComparisonChart.svelte';
	import WeightLossLineChart from './WeightLossLineChart.svelte';
	import WeightLossLineChartLegacy from './WeightLossLineChartLegacy.svelte';

	const CONTAGEM_DURATION_MS = 2000;
	const CONTAGEM_TARGET = 3;

	// mr-4: animação de carregamento com labels dinâmicos
	const PAUSE_MS = 400;
	const CARREGANDO_STEPS = $derived([
		{ label: 'Analisando biotipo e hábitos', durationMs: 3000 },
		{ label: 'Calculando perfil corporal', durationMs: 4000, pauseAt: 60 },
		{ label: criandoPlanoLabel, durationMs: 2000 },
		{ label: `Criando cardápio para ${objetivoLabel}`, durationMs: 3000, pauseAt: 20 }
	]);

	// ─── Timing da cascata ────────────────────────────────────────────────────
	// Elementos se sobrepõem (gap < duração) → tela nunca para, ritmo contínuo.
	// Pausa dramática antes do botão (botão controlado pelo QuizShell).
	const DUR   = 600;   // duração de cada texto entrando
	const DUR_C = 900;   // duração dos gráficos (elemento maior, merece mais tempo)
	const OUT   = 200;   // saída rápida
	const Y     = 12;    // deslocamento vertical sutil (px)
	const GAP   = 250;   // intervalo entre inícios (overlap = DUR - GAP = 350ms)
	// Delays calculados: badge=0, título=250, parágrafo=500, chart=800
	// Chart termina em 800+900=1700ms. Botão entra em 2800ms (pausa intencional ~1s).

	interface Props {
		question: Question;
		answers: Answers;
		/** Chamado quando as barras de carregamento do mr-4 terminam (para o botão Continuar só aparecer então). */
		onMr4LoadingComplete?: () => void;
	}

	let { question, answers, onMr4LoadingComplete }: Props = $props();

	const data = $derived(getMicroResultData(question.id, answers, quizConfig.questions));
	const objetivoLabel = $derived.by(() => {
		const goalId = answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecer'
			: goalId === 'goal-massa'
				? 'ganhar massa muscular'
				: 'seu objetivo';
	});
	/** Texto do passo "Criando plano...": ganhar massa → "Criando plano para ganhar massa"; emagrecer → "Criando plano para emagrecer". */
	const criandoPlanoLabel = $derived.by(() => {
		const goalId = answers['goal_type'] as string | undefined;
		return goalId === 'goal-massa'
			? 'Criando plano para ganhar massa'
			: `Criando plano para ${objetivoLabel}`;
	});
	const isMr1 = question.id === 'mr-1';
	const contagemCtx = getContext<{ value: number }>('quizContagem');

	/** Evento selecionado (mr-3): exibir box de aceleradores para o evento */
	const eventTypeId = $derived(answers['event_type']);
	const hasEvent = $derived(
		typeof eventTypeId === 'string' && eventTypeId !== '' && eventTypeId !== 'event-nenhuma'
	);
	const eventLabel = $derived.by(() => {
		if (!hasEvent || typeof eventTypeId !== 'string') return '';
		const q = quizConfig.questions.find((x) => x.id === 'event_type');
		const opt = q?.options?.find((o) => o.id === eventTypeId);
		return opt?.text ?? 'seu evento';
	});
	/** Data do evento formatada (dd/MM/yyyy) quando a pessoa selecionou; null caso contrário */
	const eventDateFormatted = $derived.by(() => {
		const raw = answers['event_date'];
		const str = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : null;
		if (!str || !str.trim()) return null;
		const d = new Date(str);
		if (!Number.isFinite(d.getTime())) return null;
		return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
	});
	/** Para o título mr-3: verbo na 3ª pessoa do plural (Mulheres/Homens que usam a Zuppy emagrecem / ganham massa...) */
	const headlineObjetivoVerb = $derived.by(() => {
		const goalId = answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecem'
			: goalId === 'goal-massa'
				? 'ganham massa'
				: 'alcançam seu objetivo';
	});
	const mr2Contagem = contagemCtx?.value ?? 7;
	const mr3Contagem = contagemCtx?.value ?? 10;
	const mr5Contagem = contagemCtx?.value ?? 13;

	let mr1DisplayCount = $state(0);

	// mr-4: animação da barra de progresso (mesmo da tela carregando)
	let carregandoActiveIndex = $state(0);
	let carregandoProgress = $state(0);
	let carregandoAllDone = $state(false);
	let carregandoStartTime = 0;
	let carregandoRafId = 0;

	function carregandoTick(now: number) {
		if (question.id !== 'mr-4' || carregandoAllDone) return;
		if (carregandoActiveIndex >= CARREGANDO_STEPS.length) {
			carregandoAllDone = true;
			onMr4LoadingComplete?.();
			return;
		}
		const step = CARREGANDO_STEPS[carregandoActiveIndex];
		const elapsed = now - carregandoStartTime;
		let p: number;
		if (step.pauseAt != null) {
			const phaseDuration = step.durationMs - PAUSE_MS;
			const phase1Duration = phaseDuration * (step.pauseAt / 100);
			const phase2Duration = phaseDuration * (1 - step.pauseAt / 100);
			if (elapsed <= phase1Duration) {
				p = (elapsed / phase1Duration) * step.pauseAt;
			} else if (elapsed <= phase1Duration + PAUSE_MS) {
				p = step.pauseAt;
			} else {
				const phase2Elapsed = elapsed - phase1Duration - PAUSE_MS;
				p = step.pauseAt + (phase2Elapsed / phase2Duration) * (100 - step.pauseAt);
			}
			p = Math.min(100, p);
		} else {
			p = Math.min(100, (elapsed / step.durationMs) * 100);
		}
		carregandoProgress = p;
		if (p >= 100) {
			carregandoActiveIndex += 1;
			carregandoStartTime = now;
			carregandoProgress = 0;
		}
		carregandoRafId = requestAnimationFrame(carregandoTick);
	}

	onMount(() => {
		if (question.id === 'mr-4') {
			carregandoStartTime = performance.now();
			carregandoRafId = requestAnimationFrame(carregandoTick);
			return () => cancelAnimationFrame(carregandoRafId);
		}
		if (!isMr1) return;
		let cancelled = false;
		const start = performance.now();
		let rafId: number;
		function tick(now: number) {
			if (cancelled) return;
			const elapsed = now - start;
			const t = Math.min(1, elapsed / CONTAGEM_DURATION_MS);
			const eased = 1 - (1 - t) * (1 - t);
			mr1DisplayCount = Math.round(eased * CONTAGEM_TARGET);
			if (t < 1) rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => { cancelled = true; cancelAnimationFrame(rafId); };
	});
</script>

{#if question.id === 'mr-4'}
	<div class="flex flex-col gap-8 w-full pb-24">
		<div class="flex flex-col gap-2 text-center">
			<h2 class="text-2xl font-extrabold text-heading leading-6">Estamos criando agora seu plano de calorias para <span class="text-[var(--color-nutrition-green)]">{objetivoLabel}</span></h2>
			<p class="text-sm text-body leading-[14px]">
				Isso leva apenas alguns segundos para analisarmos seu biotipo e criar seu plano.
			</p>
		</div>

		<div class="flex flex-col gap-6 w-full">
			{#each CARREGANDO_STEPS as step, i}
				{@const stepProgress = i < carregandoActiveIndex ? 100 : i === carregandoActiveIndex ? carregandoProgress : 0}
				{@const isActive = i <= carregandoActiveIndex}
				<div class="flex flex-col gap-2 w-full">
					<div class="flex justify-between items-baseline gap-2">
						<span class="flex items-center gap-2 min-w-0">
							<span class="text-sm font-medium truncate {isActive ? 'text-heading' : 'text-muted'}">{step.label}</span>
							{#if stepProgress >= 100}
								<span class="flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-[var(--color-nutrition-green)] text-white" aria-hidden="true">
									<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
										<path d="M5 12l5 5L20 7" />
									</svg>
								</span>
							{/if}
						</span>
						<span class="text-sm tabular-nums font-medium shrink-0 {isActive ? 'text-heading' : 'text-muted'}">{Math.round(stepProgress)}%</span>
					</div>
					<div class="w-full h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={stepProgress} aria-valuemin={0} aria-valuemax={100}>
						<div
							class="progress-fill h-full rounded-full transition-none relative overflow-hidden"
							style="width: {stepProgress}%; background: linear-gradient(to right, rgba(157, 187, 84, 0.1), #9DBB54);"
						>
							{#if i === carregandoActiveIndex && stepProgress > 0 && stepProgress < 100}
								<div class="progress-shimmer" aria-hidden="true"></div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

{:else if data.nexo}
	<div class="flex flex-col items-center text-center px-4 py-8 max-w-md mx-auto gap-1">

		{#if data.nexo?.variant === 'mr-1'}
			{@const nexo1Chart = data.nexo as NexoCentralizadaMr3}
			<div class="flex flex-col items-center text-center gap-1 w-full">
				<!-- mr-1: gráfico de quantos kg a pessoa vai perder/ganhar (plano de calorias) -->
				<div
					class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
					aria-label="Contagem"
					in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--color-nutrition-green)] shrink-0" aria-hidden="true">
					<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span class="text-sm font-medium tabular-nums min-w-[1ch] inline-block text-center text-[var(--color-nutrition-green-dark)]">
						{mr1DisplayCount}
					</span>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<h2 class="text-2xl font-extrabold text-heading leading-6">
						Vamos montar um plano de calorias personalizado para você <span class="text-[#8ED33A]">{nexo1Chart?.isWeightLoss ? 'perder' : 'ganhar'}</span> até <span class="text-[#8ED33A]">{nexo1Chart?.kgToReach ?? 0}kg</span>.
					</h2>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<p class="text-body text-sm leading-[14px] mt-[10px] mb-[25px]">
						Em média, <span class="text-[#8ED33A] font-bold">{nexo1Chart?.sexo ?? 'pessoas'}</span>
						{#if nexo1Chart != null && nexo1Chart.idade != null}
							com <span class="text-[#8ED33A] font-bold">{nexo1Chart.idade} anos</span>
						{:else}
							com um perfil semelhante ao seu
						{/if}
						conseguem <span class="text-[#8ED33A] font-bold">{nexo1Chart?.isWeightLoss ? 'emagrecer' : 'evoluir'}</span> até
						<span class="text-[#8ED33A] font-bold">{nexo1Chart?.kgToReach ?? 0} kg</span>
						e chegar aos <span class="text-[var(--color-nutrition-green)] font-bold">{nexo1Chart?.goalKg ?? 0}kg</span> seguindo o plano de calorias.
					</p>
				</div>

				<div
					class="flex flex-col items-center w-full mt-2"
					in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<WeightLossLineChartLegacy
						currentKg={nexo1Chart?.currentKg ?? 0}
						goalKg={nexo1Chart?.goalKg ?? 0}
						weeks={nexo1Chart?.weeksEstimate ?? 12}
					/>
				</div>
			</div>

		{:else if data.nexo?.variant === 'mr-2'}
			{@const focusAreasMr2 = answers['focus_areas']}
			{@const nexo2PrimeiroPasso = data.nexo as NexoCentralizadaMr1}
			<div class="flex flex-col items-center text-center gap-1 w-full">
				<!-- mr-2: "Primeiro passo para você emagrecer foi concluído" + BodyRadarChart -->
				<div
					class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
					aria-label="Contagem"
					in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--color-nutrition-green)] shrink-0" aria-hidden="true">
						<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span class="text-sm font-medium tabular-nums min-w-[1ch] inline-block text-center text-[var(--color-nutrition-green-dark)]">{mr2Contagem}</span>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<h2 class="text-2xl font-extrabold text-heading leading-none">
						Seu plano de calorias para <span class="text-[var(--color-nutrition-green)] font-bold">{nexo2PrimeiroPasso.objetivo}</span> vai potencializar as áreas que você quer transformar.
					</h2>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<p class="text-body text-sm leading-none mt-[10px] mb-[10px]">
						Pensado para <span class="text-[var(--color-nutrition-green)] font-bold">{nexo2PrimeiroPasso.sexo}</span>, com objetivo de <span class="text-[var(--color-nutrition-green)] font-bold">{nexo2PrimeiroPasso.objetivo}</span>, ele otimiza sua rotina para acelerar a <span class="text-[var(--color-nutrition-green)] font-bold">{nexo2PrimeiroPasso.acelerar}</span>.
					</p>
				</div>

				<div
					class="flex flex-col items-center w-full"
					in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<BodyRadarChart selected={Array.isArray(focusAreasMr2) ? focusAreasMr2 : focusAreasMr2 ? [focusAreasMr2] : []} />
				</div>
			</div>

		{:else if data.nexo?.variant === 'mr-3'}
			{@const nexo2ForMr3 = data.nexo as NexoCentralizadaMr2 | undefined}
			{#if nexo2ForMr3}
				<div class="flex flex-col items-center text-center gap-1 w-full">
					<!-- mr-3: "2.3x mais rápido" + ProtocolComparisonChart (conteúdo que era do mr-2) -->
					<div
						class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
						aria-label="Contagem"
						in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--color-nutrition-green)] shrink-0" aria-hidden="true">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="text-sm font-medium tabular-nums min-w-[1ch] inline-block text-center text-[var(--color-nutrition-green-dark)]">{mr3Contagem}</span>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<h2 class="text-2xl font-extrabold text-heading leading-none">
							<span class="text-[var(--color-nutrition-green)] font-bold">{nexo2ForMr3?.headlineSubject ?? 'Pessoas'}</span> que usam a <span class="text-[var(--color-nutrition-green)] font-bold">Zuppy</span> <span class="text-[var(--color-nutrition-green)] font-bold">{headlineObjetivoVerb}</span> até 2.3X mais rápido.
						</h2>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<p class="text-body text-sm leading-none mt-[10px] mb-[40px] pb-[25px]">
							Seu plano para <span class="text-[var(--color-nutrition-green)] font-bold">{nexo2ForMr3?.objetivo ?? 'seu objetivo'}</span> é montado totalmente individualizado para seu biotipo, basta seguir e ver o resultado.
						</p>
					</div>

					<div
						class="w-full flex flex-col gap-0"
						in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<ProtocolComparisonChart />
						{#if hasEvent}
							<div
								class="w-full rounded-b-xl bg-white/30 px-3 py-2.5 -mt-px"
								in:fly={{ y: Y, duration: DUR, delay: GAP * 3 + 50 + 600, easing: cubicOut }}
								out:fade={{ duration: OUT }}
							>
								<div class="flex items-center gap-0 text-left">
									<span class="shrink-0 flex items-center justify-center text-muted mx-[10px]" aria-hidden="true">
										<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</span>
									<div class="min-w-0">
										<h3 class="text-sm font-bold text-body leading-tight">Aceleradores para {eventLabel}</h3>
										<p class="text-xs text-muted leading-snug mt-0.5">
											Seu plano vai incluir aceleradores para você chegar no seu melhor até {eventDateFormatted ?? 'a data'}.
										</p>
									</div>
								</div>
							</div>
						{/if}
						{#if nexo2ForMr3?.showCardioBox}
							<div
								class="w-full rounded-b-xl bg-white/30 px-3 py-2.5 -mt-px"
								in:fly={{ y: Y, duration: DUR, delay: GAP * 3 + 50 + 600, easing: cubicOut }}
								out:fade={{ duration: OUT }}
							>
								<div class="flex items-center gap-0 text-left">
									<span class="shrink-0 flex items-center justify-center text-muted mx-[10px]" aria-hidden="true">
										<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</span>
									<div class="min-w-0">
										<h3 class="text-sm font-bold text-body leading-tight">Plano de Cardio</h3>
										<p class="text-xs text-muted leading-snug mt-0.5">
											Vamos integrar um plano de cardio no protocolo pra acelerar sua performance.
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>

{:else if data.lifestyleFactors?.factors}
	{@const lf = data.lifestyleFactors}
	<div class="flex flex-col gap-6 w-full max-w-md mx-auto">
		<!--
			Cascata mr-5 (~3.5s):
			badge(0) → título+subtítulo(250) → card0(600) → card1(800) → card2(1000) → botão(2800, QuizShell)
			Cada card entra individualmente → efeito de "desvendar" muito mais rico.
		-->
		<div
			class="contagem-badge-shimmer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2 w-fit self-center"
			aria-label="Contagem"
			in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
			out:fade={{ duration: OUT }}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--color-nutrition-green)] shrink-0" aria-hidden="true">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span class="text-sm font-medium tabular-nums min-w-[1ch] inline-block text-center text-[var(--color-nutrition-green-dark)]">{mr5Contagem}</span>
		</div>

		<div
			class="space-y-2 text-center"
			in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
			out:fade={{ duration: OUT }}
		>
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
				Identificamos fatores do seu estilo de vida que influenciam seu <span class="text-[var(--color-nutrition-green)] font-bold">{lf.goalType}</span>.
			</h2>
			<p class="text-sm text-muted leading-[14px]">
				{lf.subtitle}
			</p>
		</div>

		<!-- Cada card entra individualmente com stagger de 200ms entre eles -->
		<div class="grid grid-cols-3 gap-x-4 gap-y-6">
			{#each (lf?.factors ?? []) as factor, i (factor.category)}
				<div
					class="flex flex-col items-center text-center gap-1.5 rounded-xl border border-line/50 pt-[25px] pb-[25px] px-3"
					in:fly={{ y: Y, duration: DUR, delay: 600 + i * 200, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<span class="flex items-center justify-center w-10 h-10 text-accent shrink-0" aria-hidden="true">
						{#if factor.category === 'sono'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
						{:else if factor.category === 'movimento'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
						{:else if factor.category === 'energia'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						{/if}
					</span>
					<span class="text-sm font-medium text-heading">{factor.label}</span>
					<div class="flex items-center justify-center gap-1.5">
						<span
							class="shrink-0 w-2.5 h-2.5 rounded-full {factor.status === 'green'
							? 'bg-[var(--color-accent)]'
							: factor.status === 'orange'
								? 'bg-[var(--color-farol-orange)]'
								: 'bg-[var(--color-farol-red)]'}"
							aria-hidden="true"
						></span>
						<span class="text-sm text-body">{factor.value}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

{:else}
	<div class="flex flex-col gap-6">
		<div class="space-y-3">
			<div in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }} out:fade={{ duration: OUT }}>
				<h2 class="text-2xl font-extrabold text-heading leading-tight">{data.title}</h2>
			</div>
			{#if data.bullets.length > 0}
				<div in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<ul class="list-none space-y-2 text-body">
						{#each data.bullets as bullet}
							<li class="leading-relaxed">
								{@html bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.insight}
				<div in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<p class="text-body leading-relaxed mt-3 italic">"{data.insight}"</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.progress-fill {
		position: relative;
	}
	.progress-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0.35) 50%,
			rgba(255, 255, 255, 0) 70%,
			transparent 100%
		);
		background-size: 60% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
	}
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}
	.contagem-badge-shimmer {
		position: relative;
		overflow: hidden;
	}
	.contagem-badge-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 60%;
		background: linear-gradient(
			100deg,
			transparent 0%,
			transparent 40%,
			rgba(255, 255, 255, 0.12) 50%,
			transparent 60%,
			transparent 100%
		);
		animation: contagem-badge-shimmer 3.5s ease-in-out infinite;
		pointer-events: none;
		border-radius: inherit;
	}
	@keyframes contagem-badge-shimmer {
		0%   { transform: translateX(-100%) skewX(-8deg); }
		100% { transform: translateX(200%)  skewX(-8deg); }
	}
</style>
