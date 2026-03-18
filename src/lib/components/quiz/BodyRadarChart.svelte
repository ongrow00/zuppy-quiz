<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		selected: string[];
	}

	let { selected }: Props = $props();

	// Eixos alinhados às opções da pergunta focus_areas (Corpo todo = isAll, não tem eixo)
	const PARTS = [
		{ id: 'fa-barriga', label: 'Barriga' },
		{ id: 'fa-pernas', label: 'Pernas e coxas' },
		{ id: 'fa-bracos', label: 'Braços' },
		{ id: 'fa-peito', label: 'Peito' },
		{ id: 'fa-gluteos', label: 'Glúteos' }
	];

	const N = PARTS.length;
	const CX = 170;
	const CY = 162;
	const R = 85;
	const MIN_VAL = 0.18;
	const LABEL_OFFSET = 26;

	const isAll = $derived(selected.includes('fa-inteiro'));

	const targetValues = $derived(PARTS.map((p) => (isAll ? 1 : selected.includes(p.id) ? 1 : MIN_VAL)));

	// Começa quase no centro para efeito de gráfico sendo preenchido; duração maior para ser bem visível
	const FILL_START = 0.04;
	const animValues = tweened(PARTS.map(() => FILL_START), { duration: 1200, easing: cubicOut });

	onMount(() => {
		let active = true;
		animValues.set(targetValues);
		return () => {
			active = false;
			// Para a animação imediatamente ao desmontar para evitar updates em componente destruído
			animValues.set(targetValues, { duration: 0 });
		};
	});

	function angle(i: number) {
		return (i / N) * 2 * Math.PI - Math.PI / 2;
	}

	function pt(i: number, val: number) {
		const a = angle(i);
		return { x: CX + R * val * Math.cos(a), y: CY + R * val * Math.sin(a) };
	}

	function polyPoints(vals: number[]) {
		return vals.map((v, i) => `${pt(i, v).x.toFixed(2)},${pt(i, v).y.toFixed(2)}`).join(' ');
	}

	// Static grid rings
	const outerPts = polyPoints(PARTS.map(() => 1));
	const mid1Pts = polyPoints(PARTS.map(() => 0.6));
	const mid2Pts = polyPoints(PARTS.map(() => 0.35));

	// Animated data polygon
	const dataPts = $derived(polyPoints($animValues));

	function labelPt(i: number) {
		const a = angle(i);
		return {
			x: CX + (R + LABEL_OFFSET) * Math.cos(a),
			y: CY + (R + LABEL_OFFSET) * Math.sin(a)
		};
	}

	function textAnchor(i: number) {
		const x = Math.cos(angle(i));
		if (x > 0.2) return 'start';
		if (x < -0.2) return 'end';
		return 'middle';
	}

	function dominantBaseline(i: number) {
		const y = Math.sin(angle(i));
		if (y < -0.3) return 'auto';
		if (y > 0.3) return 'hanging';
		return 'middle';
	}

	/** Quebra rótulo em até 2 linhas no último espaço para caber no gráfico */
	function labelLines(label: string): [string] | [string, string] {
		const idx = label.lastIndexOf(' ');
		if (idx <= 0) return [label];
		return [label.slice(0, idx), label.slice(idx + 1)];
	}
</script>

<div class="flex flex-col items-center gap-2 w-full">
	<svg viewBox="0 0 340 325" class="w-full max-w-[300px]" aria-hidden="true">
		<!-- Axis lines (cinza claro) -->
		{#each PARTS as _, i}
			{@const op = pt(i, 1)}
			<line x1={CX} y1={CY} x2={op.x} y2={op.y} stroke="#d1d1d6" stroke-width="1" />
		{/each}

		<!-- Grid rings (cinza claro) -->
		<polygon points={mid2Pts} fill="none" stroke="#e5e5ea" stroke-width="1" />
		<polygon points={mid1Pts} fill="none" stroke="#d1d1d6" stroke-width="1" />
		<polygon points={outerPts} fill="none" stroke="#b0b0b5" stroke-width="1.5" />

		<!-- Animated data area (verde) -->
		<polygon
			points={dataPts}
			fill="var(--color-nutrition-green)"
			fill-opacity="0.18"
			stroke="var(--color-nutrition-green)"
			stroke-width="2"
			stroke-linejoin="round"
		/>

		<!-- Dots: verde quando ativo, cinza claro quando inativo -->
		{#each PARTS as part, i}
			{@const active = isAll || selected.includes(part.id)}
			{@const p = pt(i, 1)}
			<circle
				cx={p.x}
				cy={p.y}
				r={active ? 5 : 3}
				fill={active ? 'var(--color-nutrition-green)' : '#b0b0b5'}
				stroke={active ? 'var(--color-nutrition-green)' : '#d1d1d6'}
				stroke-width="1"
			/>
		{/each}

		<!-- Labels: verde quando ativo, cinza claro quando inativo -->
		{#each PARTS as part, i}
			{@const lp = labelPt(i)}
			{@const active = isAll || selected.includes(part.id)}
			{@const lines = labelLines(part.label)}
			<text
				x={lp.x}
				y={lines.length === 2 ? lp.y - 6 : lp.y}
				text-anchor={textAnchor(i)}
				dominant-baseline={lines.length === 2 ? 'auto' : dominantBaseline(i)}
				font-size="12"
				font-family="inherit"
				fill={active ? 'var(--color-nutrition-green)' : '#8e8e93'}
				font-weight={active ? '700' : '400'}
			>
				{#each lines as line, li}
					<tspan x={lp.x} dy={li === 0 ? 0 : 14}>{line}</tspan>
				{/each}
			</text>
		{/each}
	</svg>
</div>
