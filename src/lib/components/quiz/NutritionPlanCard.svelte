<script lang="ts">
	interface Props {
		includeBreakfast: boolean;
		mealCount: number;
		caloriasMeta: number;
		deficitCalorico: number;
		proteinaG: number;
		carboidratoG: number;
		gorduraG: number;
		fibraG: number;
		/** Quando definido, cliques nos gauges de macro e no cadeado levam à seção de oferta */
		scrollToOffer?: () => void;
	}

	let { includeBreakfast, mealCount, caloriasMeta, deficitCalorico, proteinaG, carboidratoG, gorduraG, fibraG, scrollToOffer }: Props = $props();

	const macros = $derived.by(() => {
		const defs = [
			{ label: 'Proteína', grams: proteinaG,    kcalPerG: 4 },
			{ label: 'Carbo',    grams: carboidratoG, kcalPerG: 4 },
			{ label: 'Gordura',  grams: gorduraG,      kcalPerG: 9 },
			{ label: 'Fibra',    grams: fibraG,        kcalPerG: 2 }
		];
		const total = defs.reduce((s, m) => s + m.grams * m.kcalPerG, 0);
		return defs.map((m) => ({ label: m.label, grams: m.grams, share: (m.grams * m.kcalPerG) / total }));
	});

	/** Barras de calorias (compacto no card): 20 segmentos, mesmo gradiente da home */
	const CAL_BAR_SEGMENTS = 20;
	/** Barra de calorias compacta: 100% preenchida */
	const calBarFilled = CAL_BAR_SEGMENTS;

	function segmentColorAtProgress(ratio: number): string {
		if (ratio <= 0.6) return '#8ED33A';
		if (ratio <= 0.85) return '#B6E635';
		if (ratio <= 1) return '#F4E84A';
		if (ratio <= 1.15) return '#F7B23B';
		if (ratio <= 1.3) return '#F47A3A';
		return '#E84C3D';
	}
	function segmentProgress(i: number): number {
		return (i + 0.5) / CAL_BAR_SEGMENTS;
	}

	// Gauge SVG (240° arc, r=26)
	const R = 26;
	const CX = 32;
	const CY = 32;
	const CIRC = 2 * Math.PI * R; // ≈ 163.4
	const ARC_DEG = 240;
	const ARC_LEN = (ARC_DEG / 360) * CIRC;  // ≈ 108.9
	const GAP_LEN = CIRC - ARC_LEN;           // ≈ 54.5

	function gaugeProgress(current: number, total: number) {
		const pct = Math.min(1, current / total);
		const filled = pct * ARC_LEN;
		const rest = CIRC - filled;
		return { dasharray: `${filled.toFixed(1)} ${rest.toFixed(1)}` };
	}

	// Déficit: linha com várias oscilações (viewBox 110×36)
	const linePoints =
		'M4,20 C14,8 22,28 32,12 C42,28 50,8 60,22 C70,8 78,28 88,14 C96,26 100,10 106,20';

	// ── Cardápio personalizado ──────────────────────────────────────────────
	type Meal = { name: string; icon: string; kcal: number };

	const ALL_MEALS: Meal[] = [
		{ name: 'Café',            icon: 'fa-solid fa-mug-hot',      kcal: 0 },
		{ name: 'Lanche da manhã', icon: 'fa-solid fa-apple-whole',  kcal: 0 },
		{ name: 'Almoço',          icon: 'fa-solid fa-utensils',     kcal: 0 },
		{ name: 'Lanche da tarde', icon: 'fa-solid fa-cookie',       kcal: 0 },
		{ name: 'Jantar',          icon: 'fa-solid fa-moon',         kcal: 0 },
		{ name: 'Ceia',            icon: 'fa-solid fa-glass-water',  kcal: 0 }
	];

	/** Distribui as calorias do dia de forma aleatória entre N refeições (soma = total). */
	function randomKcalSplit(total: number, n: number): number[] {
		const weights: number[] = [];
		let sum = 0;
		for (let i = 0; i < n; i++) {
			const w = 0.2 + Math.random() * 0.8;
			weights.push(w);
			sum += w;
		}
		const out = weights.map((w) => Math.round((w / sum) * total));
		const diff = total - out.reduce((a, b) => a + b, 0);
		out[0] = Math.max(0, out[0] + diff);
		return out;
	}

	const meals = $derived.by(() => {
		const count = Math.max(2, Math.min(6, mealCount));
		const list: Meal[] = [];

		if (includeBreakfast) list.push({ ...ALL_MEALS[0] });
		list.push({ ...ALL_MEALS[2] });
		list.push({ ...ALL_MEALS[4] });

		const remaining = count - list.length;
		if (remaining >= 1) list.splice(list.length - 1, 0, { ...ALL_MEALS[3] });
		if (remaining >= 2) list.splice(includeBreakfast ? 1 : 0, 0, { ...ALL_MEALS[1] });
		if (remaining >= 3) list.push({ ...ALL_MEALS[5] });

		const final = list.slice(0, count);
		const kcals = randomKcalSplit(caloriasMeta, final.length);
		final.forEach((m, i) => { m.kcal = kcals[i]; });
		return final;
	});

	let sliderEl = $state<HTMLDivElement | null>(null);
	let activeSlide = $state(0);

	function onSliderScroll() {
		if (!sliderEl) return;
		const cardW = sliderEl.scrollWidth / meals.length;
		activeSlide = Math.round(sliderEl.scrollLeft / cardW);
	}

	function goToSlide(i: number) {
		if (!sliderEl) return;
		const cardW = sliderEl.scrollWidth / meals.length;
		sliderEl.scrollTo({ left: i * cardW, behavior: 'smooth' });
	}
</script>

<div class="w-full min-w-0 max-w-full">

	<p class="text-xs font-semibold text-muted px-4 pt-[25px] pb-1">Suas Metas</p>
	<!-- Meta de calorias + Déficit calórico -->
	<div class="flex border-t border-line min-w-0">
		<div class="flex-1 min-w-0 px-4 pt-3 pb-3">
			<p class="text-xs text-muted mb-1">Meta de calorias</p>
			<p class="text-xl font-extrabold text-heading leading-none mb-3">
				{caloriasMeta.toLocaleString('pt-BR')}
				<span class="text-xs font-normal text-muted"> /Kcal dia</span>
			</p>
			<div class="nutrition-cal-bar flex h-[25px] w-full max-w-full min-w-0 gap-[2px]">
				{#each Array(CAL_BAR_SEGMENTS) as _, i}
					<div
						class="nutrition-cal-bar__seg"
						class:nutrition-cal-bar__seg--empty={i >= calBarFilled}
						style={i < calBarFilled
							? `background-color: ${segmentColorAtProgress(segmentProgress(i))}`
							: undefined}
					></div>
				{/each}
			</div>
		</div>

		<div class="w-px bg-line"></div>

		<div class="flex-1 min-w-0 px-4 pt-3 pb-3">
			<p class="text-xs text-muted mb-1">Déficit calórico</p>
			<p class="text-xl font-extrabold text-heading leading-none mb-3">
				{deficitCalorico.toLocaleString('pt-BR')}
				<span class="text-xs font-normal text-muted"> /Kcal dia</span>
			</p>
			<div class="h-8 flex items-center">
				<svg viewBox="0 0 110 36" class="w-full h-full" fill="none">
					<path d={linePoints} stroke="#E07070" stroke-width="2" stroke-linecap="round" />
				</svg>
			</div>
		</div>
	</div>

	<!-- Meta de macros: % de cada macro no total (arco proporcional) -->
	<div class="border-t border-line px-4 pt-3 pb-4">
		<p class="text-xs text-muted mb-3">Meta de macros</p>
		<div class="flex justify-between gap-0">
			{#each macros as macro}
				<div class="flex min-w-0 flex-1 flex-col items-center gap-0">
					<div
						class="relative inline-block"
						class:cursor-pointer={!!scrollToOffer}
						role={scrollToOffer ? 'button' : undefined}
						tabindex={scrollToOffer ? 0 : undefined}
						aria-label={scrollToOffer ? 'Ir para oferta' : undefined}
						onclick={scrollToOffer}
						onkeydown={scrollToOffer ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToOffer(); } } : undefined}
					>
						<svg width="64" height="52" viewBox="0 0 64 64" fill="none" class="max-w-full block">
						<circle
							cx={CX} cy={CY} r={R}
							stroke="#E5E5EA"
							stroke-width="5"
							stroke-linecap="round"
							fill="none"
							stroke-dasharray="{ARC_LEN.toFixed(1)} {GAP_LEN.toFixed(1)}"
							transform="rotate(150 {CX} {CY})"
						/>
						<circle
							cx={CX} cy={CY} r={R}
							stroke="#8ED33A"
							stroke-width="5"
							stroke-linecap="round"
							fill="none"
							stroke-dasharray={gaugeProgress(macro.share * 100, 100).dasharray}
							transform="rotate(150 {CX} {CY})"
						/>
						<text
							x={CX}
							y={CY + 2}
							text-anchor="middle"
							dominant-baseline="middle"
							font-size="11"
							font-weight="700"
							class="macro-gauge-value"
						>
							{macro.grams}g
						</text>
					</svg>
						<div class="macro-gauge-lock absolute inset-0 flex items-center justify-center {scrollToOffer ? '' : 'pointer-events-none'}">
							<i class="fa-solid fa-lock text-heading text-sm opacity-90" aria-hidden="true"></i>
						</div>
					</div>
					<p class="text-[10px] text-muted text-center leading-tight">{macro.label}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Cardápio personalizado -->
	<div class="border-t border-line pt-3 pb-4">
		<p class="text-xs text-muted mb-3 px-4">Cardápio {mealCount} {mealCount === 1 ? 'refeição' : 'refeições'}</p>
		<div
			bind:this={sliderEl}
			onscroll={onSliderScroll}
			class="flex overflow-x-auto gap-2 px-4 no-scrollbar"
			style="scroll-snap-type: x mandatory;"
		>
			{#each meals as meal}
				<div
					class="flex items-center gap-3 border border-line rounded-xl px-3 py-3 shrink-0"
					class:cursor-pointer={!!scrollToOffer}
					role={scrollToOffer ? 'button' : undefined}
					tabindex={scrollToOffer ? 0 : undefined}
					aria-label={scrollToOffer ? 'Ir para oferta' : undefined}
					onclick={scrollToOffer}
					onkeydown={scrollToOffer ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToOffer(); } } : undefined}
					style="width: calc(70% - 0.25rem); scroll-snap-align: start;"
				>
					<div class="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center meal-icon-bg">
						<i class="{meal.icon} text-base text-heading"></i>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-xs font-medium text-heading leading-none mb-1">{meal.name}</p>
						<p class="text-xs text-muted leading-none mb-0.5">
							<i class="fa-solid fa-fire text-[10px] text-[var(--color-nutrition-green-dark)]"></i>
							<span aria-hidden="true">**** kcal</span>
							<span class="sr-only">{meal.kcal} kcal</span>
						</p>
						<p class="text-xs text-muted leading-none">3 Opções</p>
					</div>
					<i class="fa-solid fa-lock text-xs text-muted shrink-0" aria-hidden="true"></i>
				</div>
			{/each}
		</div>

		<!-- Dots -->
		<div class="flex justify-center gap-1.5 mt-3">
			{#each meals as _, i}
				<button
					onclick={() => goToSlide(i)}
					aria-label="Ir para refeição {i + 1}"
					class="rounded-full transition-all duration-200 {activeSlide === i ? 'w-2 h-2 bg-heading' : 'w-1.5 h-1.5 bg-[#D1D1D6]'}"
				></button>
			{/each}
		</div>
	</div>

	<div class="border-t border-line"></div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

	/* Dentro do box: largura 100%; altura h-8 (alinhada à coluna déficit) */
	.nutrition-cal-bar__seg {
		flex: 1 1 0;
		min-width: 0;
		height: 100%;
		max-height: 2rem;
		border-radius: 2px;
		transition: background-color 0.15s ease-out;
	}
	.nutrition-cal-bar__seg--empty {
		background-color: #f7f6f9;
	}

	/* Valor em gramas: leve blur + cinza (bloqueado) */
	.macro-gauge-value {
		fill: #888;
		filter: blur(1.35px);
	}

	/* Ícone da refeição: cinza escuro com 5% de opacidade */
	.meal-icon-bg {
		background-color: rgba(58, 58, 62, 0.05);
	}

</style>
