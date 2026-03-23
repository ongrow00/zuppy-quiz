<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { quizStore } from '$lib/stores/quiz.store';
	import WeightLossLineChart from '$lib/components/quiz/WeightLossLineChart.svelte';

	const quiz = $derived($quizStore);

	$effect(() => {
		if (!browser) return;
		const hasCompletedQuiz = $quizStore.completedAt != null;
		if (!hasCompletedQuiz) {
			goto('/', { replaceState: true });
		}
	});

	const goalKg = $derived.by(() => {
		const raw = quiz.answers['weight_goal_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});

	const currentKg = $derived.by(() => {
		const raw = quiz.answers['weight_current_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});

	const weeksEstimate = $derived.by(() => {
		if (currentKg == null || goalKg == null) return 12;
		const kgToReach = Math.abs(goalKg - currentKg);
		return kgToReach > 0 ? Math.ceil(kgToReach * 2) : 12;
	});

	/** Previsão nunca superior a 6 meses para a data exibida */
	const MAX_WEEKS_PREVISAO = 26; // 6 meses
	const weeksParaData = $derived(Math.min(weeksEstimate, MAX_WEEKS_PREVISAO));

	const MESES: string[] = [
		'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
		'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
	];

	const dataPrevisaoFormatada = $derived.by(() => {
		const d = new Date();
		d.setDate(d.getDate() + weeksParaData * 7);
		const dia = d.getDate();
		const mes = MESES[d.getMonth()];
		return `${dia} de ${mes}`;
	});

	const headlineKg = $derived(goalKg ?? 75);

	const objetivoLabel = $derived.by(() => {
		const goalId = quiz.answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecer'
			: goalId === 'goal-massa'
				? 'ganhar massa muscular'
				: 'seu objetivo';
	});

	let displayDate = $state<string | null>(null);
	let animationDone = $state(false);

	onMount(() => {
		const finalDate = new Date();
		finalDate.setDate(finalDate.getDate() + weeksParaData * 7);
		const endTime = finalDate.getTime();
		const finalStr = `${finalDate.getDate()} de ${MESES[finalDate.getMonth()]}`;

		const startDate = new Date(finalDate);
		startDate.setDate(startDate.getDate() - 14);
		let current = new Date(startDate);
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const step = () => {
			if (current.getTime() >= endTime) {
				displayDate = finalStr;
				animationDone = true;
				return;
			}
			displayDate = `${current.getDate()} de ${MESES[current.getMonth()]}`;
			current.setDate(current.getDate() + 1);
			timeoutId = setTimeout(step, 65);
		};

		displayDate = `${startDate.getDate()} de ${MESES[startDate.getMonth()]}`;
		timeoutId = setTimeout(step, 250);

		return () => {
			if (timeoutId != null) clearTimeout(timeoutId);
		};
	});
</script>

<svelte:head>
	<title>Previsão | Zuppy</title>
</svelte:head>

<div class="flex flex-col items-start text-center px-4 py-0 max-w-md mx-auto gap-4">
	<h1 class="text-2xl font-extrabold text-heading leading-[24px] w-full text-center">
		Prevemos que você chegará a <span class="text-[var(--color-nutrition-green)]">{headlineKg} kg</span> em <span class="text-[var(--color-nutrition-green)]">{displayDate ?? dataPrevisaoFormatada}</span>.
	</h1>
	<div class="flex flex-col items-start w-full mt-2">
		<WeightLossLineChart
			currentKg={currentKg ?? (goalKg ?? 75) + 5}
			goalKg={goalKg ?? headlineKg}
			weeks={weeksParaData}
		/>
	</div>
	<ul class="w-full text-left mt-6 flex flex-col gap-3 text-[14px] leading-[14px] text-black">
		<li class="flex items-start gap-2">
			<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-nutrition-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
			</svg>
			<span>Conexão direta com seu <span class="text-[var(--color-nutrition-green)] font-bold">WhatsApp</span> para analisar tudo o que você come com uma <span class="text-[var(--color-nutrition-green)] font-bold">foto</span>.</span>
		</li>
		<li class="flex items-start gap-2">
			<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-nutrition-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
			</svg>
			<span><span class="text-[var(--color-nutrition-green)] font-bold">Plano de calorias, macros e metas</span> totalmente personalizado e ajustado conforme sua evolução.</span>
		</li>
		<li class="flex items-start gap-2">
			<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-nutrition-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2v-2"/><path d="M17 15V2"/>
			</svg>
			<span>Sugestões inteligentes de <span class="text-[var(--color-nutrition-green)] font-bold">cardápios</span> pensadas para o seu objetivo de <span class="text-[var(--color-nutrition-green)] font-bold">{objetivoLabel}</span>.</span>
		</li>
		<li class="flex items-start gap-2">
			<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-nutrition-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>
			</svg>
			<span><span class="text-[var(--color-nutrition-green)] font-bold">Análise corporal</span> por <span class="text-[var(--color-nutrition-green)] font-bold">foto</span> com <span class="text-[var(--color-nutrition-green)] font-bold">recomendações</span> feitas para o seu corpo.</span>
		</li>
	</ul>

	<button
		type="button"
		onclick={() => goto('/results')}
		class="w-full h-[60px] mt-8 flex items-center justify-center rounded-2xl font-bold text-base bg-accent text-on-primary transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
	>
		Continuar
	</button>
</div>
