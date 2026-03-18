<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Question, Answers } from '$lib/data/types';
	import RecordsCalorieCard from '$lib/components/ui/RecordsCalorieCard.svelte';
	import MealCard from '$lib/components/ui/MealCard.svelte';
	import { calculateCalorieProfile } from '$lib/utils/calories';

	interface Props {
		question: Question;
		answers: Answers;
	}

	let { question, answers }: Props = $props();

	const objetivoLabel = $derived.by(() => {
		const goalId = answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecer'
			: goalId === 'goal-massa'
				? 'ganhar massa muscular'
				: 'alcançar seu objetivo';
	});

	/** Para o título vp-1: "Emagreça" ou "Ganhe massa" conforme o objetivo do form */
	const tituloObjetivo = $derived.by(() => {
		const goalId = answers['goal_type'] as string | undefined;
		return goalId === 'goal-massa' ? 'Ganhe massa' : 'Emagreça';
	});

	const weightGoalKg = $derived(answers['weight_goal_kg'] ?? '');

	// Calorie profile calculado das respostas para o VP-2
	const calorieProfile = $derived(calculateCalorieProfile(answers));
	const calorieTarget = $derived(calorieProfile.caloriasMeta);
	// Exibe ~78% da meta para mostrar a barra na zona verde (demonstração da feature)
	const caloriesConsumed = $derived(Math.round(calorieTarget * 0.78));

	// Rotação das imagens no VP-1
	const msgs = [
		{ src: '/assets/msg-audio.png', alt: 'Mensagem de áudio' },
		{ src: '/assets/msg-foto.png',  alt: 'Mensagem de foto' },
		{ src: '/assets/msg-texto.png', alt: 'Mensagem de texto' }
	];
	let activeIndex = $state(0);
	let prevIndex = $state<number | null>(null);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	// VP-3: cycling de refeições com efeito de plaquinha de aeroporto
	const vp3Meals = [
		{ name: 'Frango e Arroz',           kcal: 520, prot: 45, carb: 55, fat: 12, initials: undefined },
		{ name: '1 fatia de Pizza',          kcal: 285, prot: 12, carb: 34, fat: 11, initials: 'PZ'      },
		{ name: 'Salada com Frango Grelhado', kcal: 380, prot: 38, carb: 18, fat: 14, initials: undefined }
	];
	let vp3Index = $state(0);
	let vp3Flipping = $state(false);
	let intervalId2: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (question.id === 'vp-1') {
			intervalId = setInterval(() => {
				prevIndex = activeIndex;
				activeIndex = (activeIndex + 1) % msgs.length;
				setTimeout(() => { prevIndex = null; }, 550);
			}, 2400);
		}
		if (question.id === 'vp-3') {
			intervalId2 = setInterval(() => {
				vp3Flipping = true;
				setTimeout(() => {
					vp3Index = (vp3Index + 1) % vp3Meals.length;
					vp3Flipping = false;
				}, 500);
			}, 5000);
		}
	});
	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (intervalId2) clearInterval(intervalId2);
	});
</script>

<div class="flex flex-col items-center text-center gap-8 px-4 py-8 max-w-md mx-auto w-full">

	{#if question.id === 'vp-1'}
		<!-- Rotating WhatsApp message images -->
		<div class="msg-rotator w-full max-w-[300px] relative" style="height: 88px; perspective: 800px;" aria-live="polite">
			{#each msgs as msg, i}
				<img
					src={msg.src}
					alt={msg.alt}
					class="msg-slide absolute inset-0 w-full h-full object-contain rounded-2xl
						{i === activeIndex ? 'msg-enter' : i === prevIndex ? 'msg-leave' : 'msg-idle'}"
				/>
			{/each}
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
				<span class="text-[var(--color-nutrition-green)]">{tituloObjetivo}</span> apenas controlando suas calorias com uma foto, áudio ou texto no <span class="text-[var(--color-nutrition-green)]">WhatsApp</span>.
			</h2>
			<p class="text-sm text-body leading-snug">
				Nossa inteligência artificial analisa sua refeição e calcula calorias e macros com até <strong>98% de precisão</strong>.
			</p>
		</div>

	{:else if question.id === 'vp-2'}
		<div class="w-full">
			<RecordsCalorieCard {caloriesConsumed} {calorieTarget} />
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
				Para <span class="text-[var(--color-nutrition-green)]">{objetivoLabel}</span> e chegar em <span class="text-[var(--color-nutrition-green)]">{weightGoalKg}kg</span>, tudo que você precisa é cumprir sua meta diária de calorias.
			</h2>
			<p class="text-sm text-body leading-snug">
				O Zuppy calcula sua meta ideal com base no seu biotipo e ajusta automaticamente conforme sua evolução.
			</p>
		</div>

	{:else if question.id === 'vp-3'}
		<div class="w-full flex flex-col items-center gap-2">
			<MealCard
				name={vp3Meals[vp3Index].name}
				kcal={vp3Meals[vp3Index].kcal}
				prot={vp3Meals[vp3Index].prot}
				carb={vp3Meals[vp3Index].carb}
				fat={vp3Meals[vp3Index].fat}
				initials={vp3Meals[vp3Index].initials}
				flipping={vp3Flipping}
			/>
			<span class="text-sm text-muted font-medium">+5 refeições</span>
		</div>

		<div class="flex flex-col gap-3">
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
				Gere cardápios ilimitados para <span class="text-[var(--color-nutrition-green)]">{objetivoLabel}</span>, sempre dentro da sua meta de calorias.
			</h2>
			<p class="text-sm text-body leading-snug">
				Sugerimos refeições inteligentes dentro da sua meta diária e distribuímos as calorias ao longo do dia.
			</p>
		</div>
	{/if}

</div>

<style>
	.msg-rotator {
		transform-style: preserve-3d;
	}

	/* Estado base: invisível e "abaixo" do eixo */
	.msg-slide {
		transform-origin: center bottom;
		backface-visibility: hidden;
	}

	.msg-idle {
		opacity: 0;
		transform: rotateX(90deg);
	}

	/* Entra vindo de baixo para cima (flip in) */
	.msg-enter {
		animation: flipIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	/* Sai subindo para cima (flip out) */
	.msg-leave {
		animation: flipOut 0.35s cubic-bezier(0.55, 0, 0.45, 1) forwards;
	}

	@keyframes flipIn {
		from {
			opacity: 0;
			transform: rotateX(60deg) translateY(12px);
		}
		to {
			opacity: 1;
			transform: rotateX(0deg) translateY(0);
		}
	}

	@keyframes flipOut {
		from {
			opacity: 1;
			transform: rotateX(0deg) translateY(0);
		}
		to {
			opacity: 0;
			transform: rotateX(-60deg) translateY(-12px);
		}
	}
</style>
