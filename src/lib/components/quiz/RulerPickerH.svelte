<script lang="ts">
	interface Props {
		value: number;
		min: number;
		max: number;
		onchange?: (v: number) => void;
	}

	let { value = $bindable(), min, max, onchange }: Props = $props();

	const TICK_W = 6; // pixels per unit
	const H = 80; // total container height
	const LABEL_H = 22; // height reserved at bottom for labels

	let containerWidth = $state(320);
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartRaw = 0;
	let rawValue = $state(value);

	$effect(() => {
		if (!isDragging) rawValue = value;
	});

	const translateX = $derived(-(rawValue - min) * TICK_W);

	function startDrag(x: number) {
		isDragging = true;
		dragStartX = x;
		dragStartRaw = rawValue;
	}

	function moveDrag(x: number) {
		if (!isDragging) return;
		// Drag left = value increases (ruler slides left → larger values come to center)
		const dx = dragStartX - x;
		rawValue = Math.min(max, Math.max(min, dragStartRaw + dx / TICK_W));
		const snapped = Math.round(rawValue);
		if (snapped !== value) {
			value = snapped;
			onchange?.(snapped);
		}
	}

	function endDrag() {
		if (!isDragging) return;
		isDragging = false;
		rawValue = Math.round(rawValue);
		value = rawValue;
		onchange?.(value);
	}

	const ticks = $derived(Array.from({ length: max - min + 1 }, (_, i) => min + i));

	function tickHeight(v: number): number {
		if (v % 10 === 0) return 28;
		if (v % 5 === 0) return 17;
		return 9;
	}

	function tickOpacity(v: number): number {
		if (v % 10 === 0) return 1;
		if (v % 5 === 0) return 0.65;
		return 0.35;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative overflow-hidden select-none touch-none"
	style="height: {H}px; cursor: {isDragging ? 'grabbing' : 'grab'}"
	bind:clientWidth={containerWidth}
	onmousedown={(e) => {
		e.preventDefault();
		startDrag(e.clientX);
	}}
	onmousemove={(e) => moveDrag(e.clientX)}
	onmouseup={endDrag}
	onmouseleave={endDrag}
	ontouchstart={(e) => startDrag(e.touches[0].clientX)}
	ontouchmove={(e) => moveDrag(e.touches[0].clientX)}
	ontouchend={endDrag}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={Math.round(rawValue)}
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'ArrowRight') {
			value = Math.min(max, value + 1);
			onchange?.(value);
		} else if (e.key === 'ArrowLeft') {
			value = Math.max(min, value - 1);
			onchange?.(value);
		}
	}}
>
	<!-- Scrolling ruler -->
	<div
		class="absolute top-0 bottom-0 flex items-stretch"
		style="
			left: 0;
			transform: translateX({translateX}px);
			transition: {isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
			will-change: transform;
		"
	>
		<!-- Left padding: keeps min value reachable at center -->
		<div style="width: {containerWidth / 2}px; flex-shrink: 0"></div>

		{#each ticks as tick}
			<div class="relative flex-shrink-0" style="width: {TICK_W}px">
				<!-- Tick line, anchored above the label area -->
				<div
					class="absolute rounded-full bg-line"
					style="
						width: 1px;
						height: {tickHeight(tick)}px;
						bottom: {LABEL_H}px;
						left: 50%;
						transform: translateX(-50%);
						opacity: {tickOpacity(tick)};
					"
				></div>
				<!-- Label for every 10th tick -->
				{#if tick % 10 === 0}
					<span
						class="absolute text-muted tabular-nums font-medium"
						style="
							font-size: 9px;
							bottom: 4px;
							left: 50%;
							transform: translateX(-50%);
							white-space: nowrap;
							line-height: 1;
						">{tick}</span
					>
				{/if}
			</div>
		{/each}

		<!-- Right padding: keeps max value reachable at center -->
		<div style="width: {containerWidth / 2}px; flex-shrink: 0"></div>
	</div>

	<!-- Fixed center indicator (vertical green line) -->
	<div
		class="pointer-events-none absolute top-0 z-10 flex flex-col items-center"
		style="left: 50%; transform: translateX(-50%); height: {H - LABEL_H + 4}px"
	>
		<div class="flex-1 w-[1.5px] bg-accent"></div>
		<div class="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
		<div class="w-[1.5px] bg-accent flex-shrink-0" style="height: {LABEL_H - 4}px"></div>
	</div>
</div>
