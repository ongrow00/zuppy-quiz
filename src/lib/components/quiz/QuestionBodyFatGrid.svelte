<script lang="ts">
	import { onMount } from 'svelte';
	import type { Question } from '$lib/data/types';
	import { BODY_FAT_IMAGES } from '$lib/assets/body-fat-images';
	import { BODY_FAT_STAGES, BODY_FAT_LABELS } from '$lib/assets/body-fat-config';
	import SliderNumberFlow from '$lib/components/ui/SliderNumberFlow.svelte';

	/** Map gender answer to image prefix: gender-m -> H, gender-f -> M */
	const GENDER_PREFIX: Record<string, string> = {
		'gender-m': 'H',
		'gender-f': 'M'
	};

	/** 6 estágios: índice 0..5 → imagem 1..6. Padrão: estágio do meio (índice 2). */
	const STAGES = BODY_FAT_STAGES;
	const DEFAULT_STAGE = 2;

	interface Props {
		question: Question;
		genderAnswer: string | undefined;
		selectedValue: string | undefined;
		/** Estágio "antes" (esquerda). Se não informado, usa o mesmo do slider (ambos iguais). */
		beforeStage?: number;
		onSelect: (questionId: string, value: string) => void;
	}

	let { question, genderAnswer, selectedValue, beforeStage, onSelect }: Props = $props();

	const prefix = $derived(GENDER_PREFIX[genderAnswer ?? ''] ?? 'H');

	/** No step objetivo (body_fat_goal / body_goal_visual): default = um nível abaixo do anterior. Senão: DEFAULT_STAGE. */
	const defaultStageForStep = $derived.by(() => {
		if ((question.id === 'body_fat_goal' || question.id === 'body_goal_visual') && beforeStage !== undefined) {
			return Math.max(0, beforeStage - 1);
		}
		return DEFAULT_STAGE;
	});

	/** Stage index 0..5 from stored value; fallback = defaultStageForStep. */
	const stageIndex = $derived.by(() => {
		if (selectedValue === undefined || selectedValue === '') return defaultStageForStep;
		const n = parseInt(selectedValue, 10);
		if (Number.isNaN(n)) return defaultStageForStep;
		return Math.min(STAGES - 1, Math.max(0, n));
	});

	/** Step "agora": preencher default só no mount. Step "objetivo": usar $effect porque o mesmo componente é reutilizado ao trocar de pergunta, então onMount não roda de novo. */
	onMount(() => {
		const isGoalQuestion = question.id === 'body_fat_goal' || question.id === 'body_goal_visual';
		if (!isGoalQuestion && (selectedValue === undefined || selectedValue === '')) {
			onSelect(question.id, String(DEFAULT_STAGE));
		}
	});

	$effect(() => {
		const isGoalQuestion = question.id === 'body_fat_goal' || question.id === 'body_goal_visual';
		if (!isGoalQuestion || beforeStage === undefined) return;
		const empty = selectedValue === undefined || selectedValue === '';
		if (!empty) return;
		const oneBelow = Math.max(0, beforeStage - 1);
		onSelect(question.id, String(oneBelow));
	});

	/** Map stage 0..5 to image key 1..6 (one stage per image). */
	const imageKey = $derived(stageIndex + 1);
	/** Estágio "antes" (esquerda): antes informado ou igual ao atual. */
	const beforeStageClamped = $derived(
		beforeStage !== undefined ? Math.min(STAGES - 1, Math.max(0, beforeStage)) : stageIndex
	);
	const beforeImageKey = $derived(beforeStageClamped + 1);
	const afterImageKey = $derived(stageIndex + 1);
	/** Label do estágio atual (ex: "11-12%") para o box abaixo do slider. */
	const currentLabel = $derived(BODY_FAT_LABELS[stageIndex] ?? '');

	function getImageSrc(key: number) {
		return BODY_FAT_IMAGES[`${prefix}_${key}`] ?? '';
	}

	const beforeImageSrc = $derived(getImageSrc(beforeImageKey));
	const afterImageSrc = $derived(getImageSrc(afterImageKey));
	/** Step 2 (objetivo / goal visual) = duas imagens (antes | setas | depois). Step 1 (agora) = uma imagem centralizada. */
	const isGoalStep = $derived(question.id === 'body_fat_goal' || question.id === 'body_goal_visual');
	const currentImageSrc = $derived(getImageSrc(imageKey));

	function handleSliderChange(value: number) {
		onSelect(question.id, String(value));
	}
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-tight">
			{#if question.id === 'body_fat_level'}
				Qual dessas imagens mais se <span class="text-accent">parece com você agora</span>?
			{:else if question.id === 'body_fat_goal'}
				Como você gostaria de <span class="text-accent">se enxergar quando alcançar o objetivo</span>?
			{:else if question.id === 'body_current'}
				Como você se <span class="text-[#8ED33A]">enxerga hoje</span>?
			{:else if question.id === 'body_goal_visual'}
				Como <span class="text-[#8ED33A]">você quer se ver</span> após alcançar seu objetivo?
			{:else}
				{question.text}
			{/if}
		</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-[14px]">{question.subtext}</p>
		{/if}
	</div>

	{#if isGoalStep}
		<!-- Step 2 (objetivo): mesma altura/espaçamento e tamanho de imagem que o step 1. -->
		<div class="relative flex flex-1 min-h-0 items-center justify-between gap-0 w-full rounded-lg px-[10%] overflow-hidden pt-4 pb-4">
			<!-- Setas animadas (mesmo elemento da página de results) -->
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
				<svg class="body-fat-arrows-svg" width="108" height="100" viewBox="0 0 108 100" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path class="arr-1" d="M0 0 L22 50 L0 100 L10 100 L32 50 L10 0 Z" fill="#8ED33A" />
					<path class="arr-2" d="M38 0 L60 50 L38 100 L48 100 L70 50 L48 0 Z" fill="#8ED33A" />
					<path class="arr-3" d="M76 0 L98 50 L76 100 L86 100 L108 50 L86 0 Z" fill="#8ED33A" />
				</svg>
			</div>
			<div class="relative z-10 flex flex-1 min-h-0 items-center justify-start shrink-0">
				{#if beforeImageSrc}
					<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
						<img
							src={beforeImageSrc}
							alt="Silhueta antes"
							class="w-full h-full object-contain object-center transition-opacity duration-200 grayscale"
							loading="eager"
						/>
					</div>
				{/if}
			</div>
			<div class="relative z-10 shrink-0 w-4" aria-hidden="true"></div>
			<div class="relative z-10 flex flex-1 min-h-0 items-center justify-end shrink-0">
				{#if afterImageSrc}
					<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
						<img
							src={afterImageSrc}
							alt="Silhueta depois"
							class="w-full h-full object-contain object-center transition-opacity duration-200"
							loading="eager"
						/>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Step 1 (agora): somente uma imagem centralizada -->
		<div class="flex flex-1 min-h-0 items-center justify-center pt-4 pb-4">
			{#if currentImageSrc}
				<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
					<img
						src={currentImageSrc}
						alt="Silhueta de referência"
						class="w-full h-full object-contain object-center transition-opacity duration-200"
						loading="eager"
						onerror={(e) => {
							const target = e.currentTarget;
							target.style.display = 'none';
							target.nextElementSibling?.classList.remove('hidden');
						}}
					/>
					<div class="hidden w-full h-full flex items-center justify-center text-center text-sm text-muted px-2" data-fallback>
						Estágio {imageKey}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Slider: 6 estágios — track + range + thumb com valor acima (estilo NumberFlow) -->
	<div class="relative flex flex-col gap-3 w-full mt-0">
		<div class="relative w-full pt-2 pb-8">
			<SliderNumberFlow
				value={stageIndex}
				min={0}
				max={STAGES - 1}
				step={1}
				displayValue={currentLabel}
				onValueChange={handleSliderChange}
				ariaLabel="Selecione o estágio que mais se parece com você"
			/>
		</div>
	</div>
</div>

<style>
	.body-fat-arrows-svg {
		width: 28vh;
		height: auto;
		max-height: 100px;
	}
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
