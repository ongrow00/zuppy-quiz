<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		caloriesConsumed?: number;
		calorieTarget?: number;
	}

	let { caloriesConsumed = 2965, calorieTarget = 3259 }: Props = $props();

	const SEGMENTS = 50;
	const DURATION = 1400; // ms

	let displayedCalories = $state(0);

	const progress = $derived(displayedCalories / Math.max(1, calorieTarget));
	const filledSegments = $derived(
		Math.min(SEGMENTS, Math.round(progress * SEGMENTS))
	);

	function easeOut(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	onMount(() => {
		const start = performance.now();
		function tick(now: number) {
			const t = Math.min((now - start) / DURATION, 1);
			displayedCalories = Math.round(easeOut(t) * caloriesConsumed);
			if (t < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});

	function segmentColorAtProgress(ratio: number): string {
		if (ratio <= 0.6) return '#8ED33A';
		if (ratio <= 0.85) return '#B6E635';
		if (ratio <= 1) return '#F4E84A';
		if (ratio <= 1.15) return '#F7B23B';
		if (ratio <= 1.3) return '#F47A3A';
		return '#E84C3D';
	}

	function segmentProgress(i: number): number {
		return (i + 0.5) / SEGMENTS;
	}
</script>

<div class="records-calorie">
	<div class="records-calorie__wrapper">
		<!-- elemento isolado só para o glow de borda -->
		<div class="records-calorie__glow-border" aria-hidden="true"></div>

		<div class="records-calorie__card">
			<div class="records-calorie__row records-calorie__cal-label">
				<div class="records-calorie__cal-icon-wrap">
					<i class="fa-solid fa-fire records-calorie__cal-icon" aria-hidden="true"></i>
				</div>
				<span class="records-calorie__cal-text">Calorias</span>
			</div>

			<div class="records-calorie__target">
				<i class="fa-solid fa-bullseye records-calorie__target-icon" aria-hidden="true"></i>
				<span class="records-calorie__target-value">{calorieTarget.toLocaleString('pt-BR')} / meta diária</span>
			</div>

			<div class="records-calorie__row records-calorie__row--value">
				<span class="records-calorie__value">{displayedCalories.toLocaleString('pt-BR')}</span>
				<span class="records-calorie__unit">/Kcal</span>
			</div>

			<div class="records-calorie__bar">
				{#each Array(SEGMENTS) as _, i}
					<div
						class="records-calorie__segment"
						class:records-calorie__segment--filled={i < filledSegments}
						style={i < filledSegments
							? `background-color: ${segmentColorAtProgress(segmentProgress(i))}`
							: undefined}
					></div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	@property --border-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes border-spin {
		to { --border-angle: 360deg; }
	}

	.records-calorie {
		width: 100%;
		margin-bottom: 10px;
	}

	/* Wrapper com padding cria o espaço físico da borda — o card fica inset */
	.records-calorie__wrapper {
		position: relative;
		padding: 2px;
	}

	/* Elemento do glow cobre o wrapper inteiro (inset: 0 = até o padding edge) */
	.records-calorie__glow-border {
		position: absolute;
		inset: 0;
		border-radius: 10px;
		pointer-events: none;
		/* Fade: visível no topo/lados, some no bottom */
		-webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 88%);
		mask-image: linear-gradient(to bottom, black 50%, transparent 88%);
	}

	/* ::before: conic-gradient girando, mascarado para só aparecer nos 2px da borda */
	.records-calorie__glow-border::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 10px;
		padding: 2px;
		background: conic-gradient(
			from var(--border-angle),
			transparent 0%,
			transparent 75%,
			rgba(100, 190, 20, 0.3) 82%,
			#6ab820 87%,
			#8ED33A 91%,
			#B6E635 93%,
			#8ED33A 95%,
			#6ab820 97%,
			transparent 100%
		);
		animation: border-spin 9s linear infinite;
		/* Mostra apenas a faixa de 2px da borda, interior limpo */
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}

	.records-calorie__card {
		width: 100%;
		height: 150px;
		background: linear-gradient(to bottom, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
		border-radius: 8px;
		padding: 14px 16px 0;
		position: relative;
	}

	.records-calorie__row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 15px;
	}

	.records-calorie__cal-label {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.records-calorie__cal-icon-wrap {
		width: 26px;
		height: 26px;
		flex-shrink: 0;
		background-color: rgba(10, 35, 5, 0.08);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.records-calorie__cal-icon {
		font-size: 12px;
		color: #0a2305;
		line-height: 1;
	}

	.records-calorie__cal-text {
		font-size: 14px;
		font-weight: 500;
		color: #0a2305;
		line-height: 1.25;
	}

	.records-calorie__row--value {
		margin-top: 0;
		margin-bottom: 15px;
		align-items: flex-end;
	}

	.records-calorie__value {
		font-size: 2rem;
		font-weight: 500;
		color: #000000;
		line-height: 1;
	}

	.records-calorie__unit {
		font-size: 12px;
		font-weight: 400;
		color: #8c8c8c;
	}

	.records-calorie__bar {
		display: flex;
		gap: 2px;
		margin-top: 0;
		margin-bottom: 15px;
		width: 100%;
	}

	.records-calorie__segment {
		flex: 1;
		height: 40px;
		min-width: 4px;
		background-color: #f7f6f9;
		border-radius: 2px;
		transition: background-color 0.15s ease-out;
	}

	.records-calorie__segment--filled {
		background-color: var(--calorie-bar-color, #8ed33a);
	}

	.records-calorie__target {
		position: absolute;
		top: 68px;
		right: 16px;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.records-calorie__target-icon {
		font-size: 10px;
		color: #8ed33a;
		line-height: 1;
	}

	.records-calorie__target-value {
		font-size: 12px;
		font-weight: 400;
		color: #8c8c8c;
	}
</style>
