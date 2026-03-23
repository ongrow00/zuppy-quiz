<script lang="ts">
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		/** Optional tag/badge above the title */
		tag?: string;
		/** Centraliza título e texto (ex.: tela info medicamento) */
		center?: boolean;
	}

	let { question, tag, center = false }: Props = $props();

	/** Toggle visual do card “Protocolo Adaptado” (tela info medicamento). */
	let protocolAdaptedOn = $state(true);

	const title = $derived(question.copyTitle ?? question.text);
	const body = $derived(question.copyBody ?? question.subtext ?? '');
	const ctaText = $derived(question.ctaText ?? 'Continuar');
</script>

<div class="flex flex-col {center ? 'items-start text-left max-w-md w-full gap-[25px]' : 'gap-6'}">
	<div class="{center ? 'space-y-2 text-left w-full' : 'space-y-3'}">
		{#if tag}
			<span class="inline-block px-3 py-1.5 text-xs font-medium rounded-full bg-accent/15 text-accent">
				{tag}
			</span>
		{/if}
		{#if center}
			<h2 class="text-2xl font-bold text-heading leading-8 text-left">{title}</h2>
		{:else}
			<h2 class="text-2xl font-extrabold text-heading leading-tight">{title}</h2>
		{/if}
		{#if body}
			<p class="text-base text-body whitespace-pre-line {center ? 'leading-6 text-left' : 'leading-relaxed'}">{body}</p>
		{/if}
	</div>
	{#if center}
		<!-- Box estilo Apple: toggle interativo + Protocolo Adaptado -->
		<button
			type="button"
			class="relative w-full rounded-2xl bg-surface-2 border border-line p-4 flex items-center gap-4 text-left overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.99] transition-transform"
			role="switch"
			aria-checked={protocolAdaptedOn}
			aria-label="Protocolo adaptado para uso de medicamento para emagrecimento"
			onclick={() => (protocolAdaptedOn = !protocolAdaptedOn)}
		>
			<span
				class="shimmer-overlay pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
				aria-hidden="true"
			></span>
			<div
				class="relative z-10 flex shrink-0 w-11 h-7 items-center rounded-full p-1 transition-colors {protocolAdaptedOn
					? 'bg-accent'
					: 'bg-[#C7C7CC]'}"
				aria-hidden="true"
			>
				<span
					class="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out will-change-transform {protocolAdaptedOn
						? 'translate-x-4'
						: 'translate-x-0'}"
				></span>
			</div>
			<div class="relative z-10 flex flex-col gap-0.5 min-w-0">
				<span class="text-sm font-semibold text-heading">Protocolo Adaptado</span>
				<span class="text-xs text-body leading-snug"
					>Ajustar para respeitar o uso de medicamento para emagrecimento.</span
				>
			</div>
		</button>
	{/if}
	<!-- CTA is rendered by QuizShell (fixed button with ctaText) -->
</div>
