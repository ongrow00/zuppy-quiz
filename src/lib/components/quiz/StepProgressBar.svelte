<script lang="ts">
	interface Props {
		percent: number;
		steps?: number;
		class?: string;
	}

	let { percent, steps = 6, class: className = '' }: Props = $props();

	const clamped = $derived(Math.min(100, Math.max(0, percent)));

	// Checkpoints evenly distributed: 1/6, 2/6 ... 6/6 of the bar
	// Fill reaches them progressively — no snapping
	const positions = $derived(
		Array.from({ length: steps }, (_, i) => ((i + 1) / steps) * 100)
	);

	// A checkpoint "lights up" when the continuous fill reaches its position
	const reached = $derived((pos: number) => clamped >= pos);
</script>

<div
	class="relative w-full flex items-center {className}"
	style="height: 28px;"
	role="progressbar"
	aria-valuenow={Math.round(clamped)}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<!-- Track (dark, 2px) -->
	<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-line rounded-full"></div>

	<!-- Fill (verde claro, 2px, continuous) -->
	<div
		class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-nutrition-green rounded-full transition-[width] duration-300 ease-out"
		style="width: {clamped}%"
	></div>

	<!-- Checkpoint ícones (raio) -->
	{#each positions as pos, i (i)}
		{@const isLast = i === positions.length - 1}
		<div
			class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center border-2 border-bg transition-colors duration-300
				{isLast ? 'step-icon-shimmer bg-nutrition-green' : reached(pos) ? 'bg-nutrition-green' : 'bg-line'}"
			style="left: {pos}%"
		>
			<svg
				class="w-2.5 h-2.5 transition-colors duration-300 shrink-0 {isLast || reached(pos) ? 'text-accent' : 'text-muted'}"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	{/each}
</div>

<style>
	.step-icon-shimmer {
		background-color: var(--color-nutrition-green);
		animation: step-shimmer 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
	@keyframes step-shimmer {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(142, 211, 58, 0.6), 0 0 10px 2px rgba(142, 211, 58, 0.35);
			opacity: 1;
		}
		50% {
			box-shadow: 0 0 0 6px rgba(142, 211, 58, 0.25), 0 0 18px 4px rgba(142, 211, 58, 0.3);
			opacity: 1;
		}
	}
</style>
