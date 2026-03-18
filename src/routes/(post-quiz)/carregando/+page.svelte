<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import { quizStore } from '$lib/stores/quiz.store';

	const CARREGANDO_COMPLETED_KEY = 'zuppy-carregando-completed';
	const PAUSE_MS = 400;

	const objetivoLabel = $derived.by(() => {
		const goalId = get(quizStore).answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecer'
			: goalId === 'goal-massa'
				? 'ganhar massa muscular'
				: 'seu objetivo';
	});

	const STEPS = $derived([
		{ label: 'Analisando objetivo', durationMs: 3000 },
		{ label: 'Analisando biotipo e hábitos', durationMs: 4000, pauseAt: 60 },
		{ label: 'Calculando calorias', durationMs: 2000 },
		{ label: `Criando plano para ${objetivoLabel}`, durationMs: 3000, pauseAt: 20 }
	]);

	let activeIndex = $state(0);
	let progress = $state(0); // 0..100 for current step
	let allDone = $state(false);

	let startTime = 0;
	let rafId = 0;

	function tick(now: number) {
		if (activeIndex >= STEPS.length) {
			allDone = true;
			return;
		}
		const step = STEPS[activeIndex];
		const elapsed = now - startTime;
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
		progress = p;
		if (p >= 100) {
			activeIndex += 1;
			startTime = now;
			progress = 0;
		}
		rafId = requestAnimationFrame(tick);
	}

	function markCarregandoCompleted() {
		if (browser) sessionStorage.setItem(CARREGANDO_COMPLETED_KEY, '1');
	}

	function goToNome() {
		markCarregandoCompleted();
		goto('/nome');
	}

	onMount(() => {
		if (browser && sessionStorage.getItem(CARREGANDO_COMPLETED_KEY) === '1') {
			// Usuário voltou: mostrar tela já carregada (todas as barras 100%, botão Continuar visível)
			activeIndex = STEPS.length;
			progress = 100;
			allDone = true;
			return;
		}
		startTime = performance.now();
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});
</script>

<svelte:head>
	<title>Zuppy</title>
</svelte:head>

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
</style>

<div class="flex flex-col gap-8 w-full pb-24">
	<div class="flex flex-col gap-2 text-center">
		<h2 class="text-2xl font-extrabold text-black leading-6">Estamos criando agora seu plano de calorias para <span class="text-[var(--color-nutrition-green)]">{objetivoLabel}</span></h2>
		<p class="text-sm text-black leading-[14px]">
			Isso leva apenas alguns segundos para analisarmos seu biotipo e criar seu plano.
		</p>
	</div>

	<div class="flex flex-col gap-6 w-full">
		{#each STEPS as step, i}
			{@const stepProgress = i < activeIndex ? 100 : i === activeIndex ? progress : 0}
			{@const isActive = i <= activeIndex}
			<div class="flex flex-col gap-2 w-full">
				<div class="flex justify-between items-baseline gap-2">
					<span class="text-sm font-medium text-black">{step.label}</span>
					<span class="text-sm tabular-nums font-medium text-black">{Math.round(stepProgress)}%</span>
				</div>
				<div class="w-full h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={stepProgress} aria-valuemin={0} aria-valuemax={100}>
					<div
						class="progress-fill h-full rounded-full transition-none relative overflow-hidden"
						style="width: {stepProgress}%; background: linear-gradient(to right, rgba(157, 187, 84, 0.1), #9DBB54);"
					>
						{#if i === activeIndex && stepProgress > 0 && stepProgress < 100}
							<div class="progress-shimmer" aria-hidden="true"></div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if allDone}
		<div class="fixed bottom-0 left-0 right-0">
			<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-8">
			<button
				type="button"
				onclick={goToNome}
				class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-on-primary transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				<span>Continuar</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</button>
			</div>
		</div>
	{/if}
</div>
