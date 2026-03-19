<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { BODY_FAT_IMAGES } from '$lib/assets/body-fat-images';
	import { BODY_FAT_LABELS } from '$lib/assets/body-fat-config';

	/** Evita mismatch de hidratação: servidor e primeiro frame do cliente usam placeholder. */
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
	const placeholderSrc = BODY_FAT_IMAGES['H_1'] ?? '';

	interface Props {
		/** Estágio atual do usuário (0–5), de body_current */
		currentStage: number;
		/** Estágio objetivo do usuário (0–5), de body_goal_visual */
		goalStage: number;
		/** Resposta de gender: 'gender-m' | 'gender-f' */
		gender: string | undefined;
		/** Estimativa de gordura corporal atual em % (Deurenberg) */
		currentBfPercent?: number | null;
		/** Estimativa de gordura corporal objetivo em % (midpoint do estágio) */
		goalBfPercent?: number | null;
	}

	let { currentStage, goalStage, gender, currentBfPercent, goalBfPercent }: Props = $props();

	const TOTAL_BARS = 5;
	const GENDER_PREFIX: Record<string, string> = {
		'gender-m': 'H',
		'gender-f': 'M'
	};

	const prefix = $derived(GENDER_PREFIX[gender ?? ''] ?? 'H');

	function getImageSrc(stage: number) {
		const key = `${prefix}_${stage + 1}`;
		return BODY_FAT_IMAGES[key] ?? '';
	}

	function getMuscleSegments(percent: number) {
		const filled = (TOTAL_BARS * percent) / 100;
		const full = Math.min(TOTAL_BARS, Math.floor(filled));
		const partial = filled - full;
		return { full, partial };
	}

	function musclePercentFromStage(stage: number): number {
		const map: Record<number, number> = { 0: 82, 1: 68, 2: 54, 3: 40, 4: 27, 5: 16 };
		return map[stage] ?? 40;
	}

	const muscleSegmentsNow = $derived(getMuscleSegments(musclePercentFromStage(currentStage)));
	const muscleSegmentsGoal = $derived(getMuscleSegments(Math.max(musclePercentFromStage(goalStage), musclePercentFromStage(currentStage) + 8)));

	const currentImageSrc = $derived(getImageSrc(currentStage));
	const goalImageSrc = $derived(getImageSrc(goalStage));
	const currentFatLabel = $derived(BODY_FAT_LABELS[currentStage] ?? '');
	const goalFatLabel = $derived(BODY_FAT_LABELS[goalStage] ?? '');
</script>

<div class="w-full">
	<!-- Headers -->
	<div class="flex text-sm font-medium text-muted border-b border-line">
		<div class="flex-1 text-center py-3">Agora</div>
		<div class="w-px bg-line"></div>
		<div class="flex-1 text-center py-3">Objetivo</div>
	</div>

	<!-- Body images -->
	<div class="relative flex items-end">
		<!-- Arrows animadas atrás das imagens -->
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<svg width="108" height="100" viewBox="0 0 108 100" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path class="arr-1" d="M0 0 L22 50 L0 100 L10 100 L32 50 L10 0 Z" fill="#8ED33A" />
				<path class="arr-2" d="M38 0 L60 50 L38 100 L48 100 L70 50 L48 0 Z" fill="#8ED33A" />
				<path class="arr-3" d="M76 0 L98 50 L76 100 L86 100 L108 50 L86 0 Z" fill="#8ED33A" />
			</svg>
		</div>

		<div class="relative z-10 flex-1 flex justify-center pt-2 pb-2 px-4">
			{#if placeholderSrc || currentImageSrc}
				<img
					src={browser && hydrated && currentImageSrc ? currentImageSrc : placeholderSrc}
					alt="Corpo atual"
					class="h-[100px] w-auto object-contain object-bottom grayscale"
				/>
			{/if}
		</div>
		<div class="relative z-10 flex-1 flex justify-center pt-2 pb-2 px-4">
			{#if placeholderSrc || goalImageSrc}
				<img
					src={browser && hydrated && goalImageSrc ? goalImageSrc : placeholderSrc}
					alt="Corpo objetivo"
					class="h-[100px] w-auto object-contain object-bottom"
				/>
			{/if}
		</div>
	</div>

	<!-- Gordura corporal -->
	<div class="flex border-t border-line">
		<div class="flex-1 px-4 pt-3 pb-3">
			<p class="text-xs text-muted mb-0.5">Gordura corporal</p>
			{#if currentBfPercent != null}
				<p class="text-lg font-extrabold text-[#0A2305]">± {currentBfPercent}%</p>
				<p class="text-[10px] text-muted leading-none mt-0.5">{currentFatLabel}</p>
			{:else}
				<p class="text-lg font-extrabold text-[#0A2305]">{currentFatLabel}</p>
			{/if}
		</div>
		<div class="w-px bg-line"></div>
		<div class="flex-1 px-4 pt-3 pb-3">
			<p class="text-xs text-muted mb-0.5">Gordura corporal</p>
			{#if goalBfPercent != null}
				<p class="text-lg font-extrabold text-[#0A2305]">± {goalBfPercent}%</p>
				<p class="text-[10px] text-muted leading-none mt-0.5">{goalFatLabel}</p>
			{:else}
				<p class="text-lg font-extrabold text-[#0A2305]">{goalFatLabel}</p>
			{/if}
		</div>
	</div>

	<!-- Massa Muscular -->
	<div class="flex border-t border-b border-line pb-4">
		<div class="flex-1 px-4 pt-3">
			<p class="text-xs text-muted mb-2">Massa Muscular</p>
			<div class="flex gap-1">
				{#each Array.from({ length: TOTAL_BARS }, (_, i) => i) as i}
					{#if i < muscleSegmentsNow.full}
						<div class="h-2 flex-1 rounded-full bg-nutrition-green"></div>
					{:else if i === muscleSegmentsNow.full && muscleSegmentsNow.partial > 0}
						<div class="h-2 flex-1 rounded-full bg-[#D1D1D6] overflow-hidden">
							<div
								class="h-full max-w-full bg-nutrition-green rounded-l-full"
								style="width: {muscleSegmentsNow.partial * 100}%"
							></div>
						</div>
					{:else}
						<div class="h-2 flex-1 rounded-full bg-[#D1D1D6]"></div>
					{/if}
				{/each}
			</div>
		</div>
		<div class="w-px bg-line"></div>
		<div class="flex-1 px-4 pt-3">
			<p class="text-xs text-muted mb-2">Massa Muscular</p>
			<div class="flex gap-1">
				{#each Array.from({ length: TOTAL_BARS }, (_, i) => i) as i}
					{#if i < muscleSegmentsGoal.full}
						<div class="h-2 flex-1 rounded-full bg-nutrition-green"></div>
					{:else if i === muscleSegmentsGoal.full && muscleSegmentsGoal.partial > 0}
						<div class="h-2 flex-1 rounded-full bg-[#D1D1D6] overflow-hidden">
							<div
								class="h-full max-w-full bg-nutrition-green rounded-l-full"
								style="width: {muscleSegmentsGoal.partial * 100}%"
							></div>
						</div>
					{:else}
						<div class="h-2 flex-1 rounded-full bg-[#D1D1D6]"></div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes arrow-wave {
		0%, 60%, 100% { opacity: 0.12; }
		30% { opacity: 0.85; }
	}

	.arr-1 {
		opacity: 0.12;
		animation: arrow-wave 2s ease-in-out infinite;
		animation-delay: 0s;
	}
	.arr-2 {
		opacity: 0.12;
		animation: arrow-wave 2s ease-in-out infinite;
		animation-delay: 0.35s;
	}
	.arr-3 {
		opacity: 0.12;
		animation: arrow-wave 2s ease-in-out infinite;
		animation-delay: 0.7s;
	}
</style>
