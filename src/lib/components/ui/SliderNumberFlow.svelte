<script lang="ts">
	import ArrowHorizontal from '$lib/components/ui/ArrowHorizontal.svelte';
	import LottieSwipeRight from '$lib/components/ui/LottieSwipeRight.svelte';

	interface Props {
		/** Current value (single value for single thumb) */
		value: number;
		min?: number;
		max?: number;
		step?: number;
		/** Label or string to show above the thumb (e.g. "31-40%" or formatted number) */
		displayValue?: string;
		/** Callback when value changes */
		onValueChange?: (value: number) => void;
		class?: string;
		ariaLabel?: string;
	}

	let {
		value,
		min = 0,
		max = 100,
		step = 1,
		displayValue,
		onValueChange,
		class: className = '',
		ariaLabel = 'Valor'
	}: Props = $props();

	const displayText = $derived(displayValue ?? String(value));
	const hint = 'Arraste para ajustar';
	const valuePercent = $derived((max - min) <= 0 ? 0 : ((value - min) / (max - min)) * 100);

	/** Build an array of step dot positions when steps are discrete and few enough to show */
	const stepDots = $derived.by(() => {
		if (step <= 0 || max <= min) return [];
		const count = Math.round((max - min) / step) + 1;
		if (count < 2 || count > 20) return [];
		return Array.from({ length: count }, (_, i) => (i / (count - 1)) * 100);
	});

	let isDragging = $state(false);

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const num = parseFloat(target.value);
		if (!Number.isNaN(num)) onValueChange?.(num);
	}
</script>

<div class="flex flex-col gap-2 w-full {className}">
	<!-- Slider row with 25px side margins -->
	<div class="relative flex h-[26px] touch-none select-none items-center mx-[50px]" role="presentation">
		<!-- Invisible range input for interaction and a11y -->
		<input
			type="range"
			{min}
			{max}
			{step}
			{value}
			oninput={handleInput}
			onchange={handleInput}
			onpointerdown={() => (isDragging = true)}
			onpointerup={() => (isDragging = false)}
			onpointerleave={() => (isDragging = false)}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-label={ariaLabel}
			class="absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:pointer-events-none"
		/>

		<!-- Track -->
		<div
			class="relative h-[4px] w-full grow rounded-full bg-zinc-200"
			aria-hidden="true"
		>
			<!-- Step dots -->
			{#each stepDots as dotPercent}
				<div
					class="absolute top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300"
					style="left: {dotPercent}%"
				/>
			{/each}
		</div>

		<!-- Thumb (visual only) -->
		<div
			class="pointer-events-none absolute top-1/2 z-0 h-[26px] w-[26px] rounded-full bg-green-800 shadow-md ring-2 ring-white transition-transform duration-100 {isDragging
				? 'scale-125 shadow-lg'
				: ''}"
			style="left: {valuePercent}%; transform: translate(-50%, -50%)"
			aria-hidden="true"
		>
			<!-- Small arrow pointing down toward the label -->
			<div
				class="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-[3px] h-[7px] w-[7px] rotate-45 bg-[var(--color-accent)]"
				aria-hidden="true"
			/>

			<!-- Label below thumb -->
			<div
				class="absolute top-full left-1/2 mt-3 -translate-x-1/2 whitespace-nowrap"
				aria-live="polite"
			>
				{#key displayText}
					<span
						class="inline-block rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-sm font-bold text-white shadow-sm animate-label-pop"
					>
						{displayText}
					</span>
				{/key}
			</div>
		</div>
	</div>

	<!-- Hint (mesmo padrão peso / altura / idade) -->
	<p
		class="flex flex-wrap items-center justify-center gap-x-2 pt-[15px] mt-8 text-[14px] text-muted text-center"
	>
		<ArrowHorizontal direction="left" />
		<span class="font-bold text-heading">{hint}</span>
		<ArrowHorizontal direction="right" />
	</p>
	<div class="flex w-full justify-center">
		<LottieSwipeRight />
	</div>
</div>

<style>
	@keyframes label-pop {
		0% {
			opacity: 0.5;
			transform: translateX(-50%) translateY(-4px) scale(0.92);
		}
		60% {
			transform: translateX(-50%) translateY(1px) scale(1.04);
		}
		100% {
			opacity: 1;
			transform: translateX(-50%) translateY(0) scale(1);
		}
	}
	.animate-label-pop {
		animation: label-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
</style>
