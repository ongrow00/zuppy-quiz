<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		currentKg: number;
		goalKg: number;
		weeks: number;
		hideAxisLabels?: boolean;
	}

	let { currentKg, goalKg, weeks, hideAxisLabels = false }: Props = $props();

	// ─── Layout ───────────────────────────────────────────────
	const W = 340;
	const H = 200;
	const PAD_TOP    = 52;   // espaço para label "XX kg" em cima
	const PAD_BOTTOM = 28;   // espaço para eixo X
	const PAD_LEFT   = 0;
	const PAD_RIGHT  = 0;

	const graphW = W - PAD_LEFT - PAD_RIGHT;
	const graphH = H - PAD_TOP - PAD_BOTTOM;

	// Goal point at 62% width — flat maintain line after
	const GOAL_RATIO = 0.62;
	const xStart = PAD_LEFT;
	const xGoal  = PAD_LEFT + graphW * GOAL_RATIO;
	const xEnd   = W - PAD_RIGHT;

	const isLoss = goalKg < currentKg;
	const minKg  = Math.min(currentKg, goalKg);
	const maxKg  = Math.max(currentKg, goalKg);
	const range  = maxKg - minKg || 1;

	// Extra vertical padding so curve doesn't hug edges
	const VPAD = graphH * 0.1;
	function yScale(kg: number): number {
		return PAD_TOP + VPAD + (maxKg - kg) / range * (graphH - VPAD * 2);
	}

	const yStart = yScale(currentKg);
	const yGoal  = yScale(goalKg);

	// Cubic bezier: smooth S-shape
	const cp1x = xStart + (xGoal - xStart) * 0.42;
	const cp1y = yStart;
	const cp2x = xStart + (xGoal - xStart) * 0.58;
	const cp2y = yGoal;

	const curvePath = `M ${xStart} ${yStart} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${xGoal} ${yGoal}`;

	// Area under curve + flat maintain area
	const areaPath = `${curvePath} L ${xEnd} ${yGoal} L ${xEnd} ${H - PAD_BOTTOM} L ${xStart} ${H - PAD_BOTTOM} Z`;

	// ─── Goal date label ──────────────────────────────────────
	const MONTHS_PT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
	const goalDateLabel = $derived.by(() => {
		if (!browser) return '';
		const d = new Date();
		d.setDate(d.getDate() + Math.max(1, weeks) * 7);
		return MONTHS_PT[d.getMonth()] + ' ' + d.getFullYear();
	});

	// ─── Bubble "Goal / XX kg" ────────────────────────────────
	const BUBBLE_W  = 72;
	const BUBBLE_H  = 46;
	const BUBBLE_R  = 10;
	// Clamp so bubble doesn't overflow left/right
	const bubbleX = Math.min(Math.max(xGoal - BUBBLE_W / 2, 4), W - BUBBLE_W - 4);
	const bubbleY = yGoal - BUBBLE_H - 14;

	// ─── Animation ───────────────────────────────────────────
	let lineEl: SVGPathElement | undefined = $state();
	let totalLength = $state(1000);
	let animate = $state(false);

	onMount(() => {
		if (lineEl) totalLength = lineEl.getTotalLength();
		requestAnimationFrame(() => requestAnimationFrame(() => { animate = true; }));
	});
</script>

<div class="flex flex-col w-full">
	<div
		class="relative w-full"
		style="height: {H}px;"
		role="img"
		aria-label="Gráfico de evolução do peso até {goalKg}kg"
	>
		<svg
			width="100%"
			height={H}
			viewBox="0 0 {W} {H}"
			class="overflow-visible block"
			fill="none"
		>
		<defs>
			<!-- Gradient under curve (green → transparent) -->
			<linearGradient id="wlc-area-grad" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%"   stop-color="#9DBB54" stop-opacity="0.22" />
				<stop offset="100%" stop-color="#9DBB54" stop-opacity="0.02" />
			</linearGradient>

			<!-- Clip that reveals left-to-right on animate -->
			<clipPath id="wlc-reveal">
				<rect
					x={xStart} y="0"
					width={animate ? (xEnd - xStart) : 0}
					height={H}
					class="wlc-clip-rect"
				/>
			</clipPath>

			<filter id="wlc-dot-shadow" x="-60%" y="-60%" width="220%" height="220%">
				<feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-color="#9DBB54" flood-opacity="0.5" />
			</filter>
		</defs>

		<!-- ── Area fill ── -->
		<path
			d={areaPath}
			fill="url(#wlc-area-grad)"
			clip-path="url(#wlc-reveal)"
		/>

		<!-- ── Maintain weight flat line (green dashed) ── -->
		<line
			x1={xGoal} y1={yGoal}
			x2={xEnd}  y2={yGoal}
			stroke="#9DBB54"
			stroke-width="2"
			stroke-dasharray="5 4"
			stroke-linecap="round"
			clip-path="url(#wlc-reveal)"
		/>

		<!-- ── Main loss curve ── -->
		<path
			bind:this={lineEl}
			d={curvePath}
			stroke="#9DBB54"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="wlc-line"
			style="stroke-dasharray: {totalLength}; stroke-dashoffset: {animate ? 0 : totalLength};"
		/>

		<!-- ── Start dot + label ── -->
		<g class="wlc-marker-start" class:wlc-animate={animate}>
			<circle cx={xStart} cy={yStart} r={14} fill="#9DBB54" fill-opacity="0.12" />
			<circle cx={xStart} cy={yStart} r={6}  fill="#9DBB54" stroke="white" stroke-width="2" filter="url(#wlc-dot-shadow)" />
			<!-- Label: currentKg above dot -->
			<text
				x={xStart + 14}
				y={yStart - 6}
				text-anchor="start"
				font-size="13"
				font-weight="700"
				fill="var(--color-heading, #111)"
				font-family="inherit"
			>{currentKg} kg</text>
		</g>

		<!-- ── Goal dot ── -->
		<g class="wlc-marker-goal" class:wlc-animate={animate}>
			<circle cx={xGoal} cy={yGoal} r={14} fill="#9DBB54" fill-opacity="0.15" />
			<circle cx={xGoal} cy={yGoal} r={7}  fill="#9DBB54" stroke="white" stroke-width="2.5" filter="url(#wlc-dot-shadow)" />
		</g>

		<!-- ── Goal bubble ── -->
		<g class="wlc-bubble" class:wlc-animate={animate}>
			<!-- Shadow -->
			<rect
				x={bubbleX + 1} y={bubbleY + 2}
				width={BUBBLE_W} height={BUBBLE_H}
				rx={BUBBLE_R} ry={BUBBLE_R}
				fill="#9DBB54" fill-opacity="0.18"
			/>
			<!-- Bubble body -->
			<rect
				x={bubbleX} y={bubbleY}
				width={BUBBLE_W} height={BUBBLE_H}
				rx={BUBBLE_R} ry={BUBBLE_R}
				fill="#9DBB54"
			/>
			<!-- "Goal" text -->
			<text
				x={bubbleX + BUBBLE_W / 2}
				y={bubbleY + 16}
				text-anchor="middle"
				font-size="11"
				font-weight="500"
				fill="white"
				fill-opacity="0.9"
				font-family="inherit"
			>Meta</text>
			<!-- Weight text -->
			<text
				x={bubbleX + BUBBLE_W / 2}
				y={bubbleY + 33}
				text-anchor="middle"
				font-size="15"
				font-weight="800"
				fill="white"
				font-family="inherit"
			>{goalKg} kg</text>
			<!-- Small triangle pointer -->
			<polygon
				points="{xGoal - 6},{bubbleY + BUBBLE_H} {xGoal + 6},{bubbleY + BUBBLE_H} {xGoal},{yGoal - 8}"
				fill="#9DBB54"
			/>
		</g>

		<!-- ── "Manter peso" label ── -->
		<g class="wlc-maintain" class:wlc-animate={animate}>
			<text
				x={xEnd - 4}
				y={yGoal - 10}
				text-anchor="end"
				font-size="11"
				font-weight="600"
				fill="#9DBB54"
				font-family="inherit"
			>Manter peso</text>
		</g>

		<!-- ── X-axis labels ── -->
		{#if !hideAxisLabels}
		<g class="wlc-axis" class:wlc-animate={animate}>
			<text
				x={xStart}
				y={H - 6}
				text-anchor="start"
				font-size="11"
				font-weight="600"
				fill="var(--color-muted, #888)"
				font-family="inherit"
				letter-spacing="0.5"
			>AGORA</text>
			<text
				x={xEnd}
				y={H - 6}
				text-anchor="end"
				font-size="11"
				font-weight="600"
				fill="var(--color-muted, #888)"
				font-family="inherit"
				letter-spacing="0.5"
			>{goalDateLabel}</text>
		</g>
		{/if}

		</svg>
	</div>
	<p
		class="mt-5 w-full text-center text-muted"
		style="font-size: 8px; line-height: 8px;"
	>
		*Com base nos dados de usuários que registram o progresso no aplicativo. Consulte seu médico antes.
		O gráfico é uma ilustração não personalizada e os resultados podem variar.
	</p>
</div>

<style>
	.wlc-line {
		transition: stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
	}
	.wlc-clip-rect {
		transition: width 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
	}

	.wlc-marker-start {
		opacity: 0;
		transition: opacity 0.4s ease-out 0.05s;
	}
	.wlc-marker-start.wlc-animate { opacity: 1; }

	.wlc-marker-goal {
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s;
	}
	.wlc-marker-goal.wlc-animate { opacity: 1; }

	.wlc-bubble {
		opacity: 0;
		transform: translateY(6px);
		transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.25s,
		            transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.25s;
	}
	.wlc-bubble.wlc-animate {
		opacity: 1;
		transform: translateY(0);
	}

	.wlc-maintain {
		opacity: 0;
		transition: opacity 0.4s ease-out 1.4s;
	}
	.wlc-maintain.wlc-animate { opacity: 1; }

	.wlc-axis {
		opacity: 0;
		transition: opacity 0.4s ease-out 0.3s;
	}
	.wlc-axis.wlc-animate { opacity: 1; }
</style>
