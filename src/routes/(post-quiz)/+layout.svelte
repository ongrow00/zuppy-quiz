<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import StickyDiscountBanner from '$lib/components/ui/StickyDiscountBanner.svelte';
	import { start as startDiscountCountdown } from '$lib/stores/discount-countdown.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	let { children } = $props();
	let scrollContainer = $state<HTMLDivElement | null>(null);
	let showStickyBanner = $state(false);
	/** Banner aparece após passar a seção "Suas Metas" (título + BodyBeforeAfterCard + início do NutritionPlanCard) */
	const STICKY_SCROLL_THRESHOLD = 50;
	const RESULTS_BANNER_SCROLL_THRESHOLD = 400;

	const POST_QUIZ_STEPS = ['/carregando', '/nome', '/whatsapp', '/previsao', '/results'] as const;

	const pathname = $derived($page.url.pathname);
	const currentIndex = $derived(
		POST_QUIZ_STEPS.findIndex((p) => pathname === p || pathname.startsWith(p + '/'))
	);
	const stepIndex = $derived(currentIndex >= 0 ? currentIndex : 0);
	// Nome, WhatsApp e results: barra sempre 100%
	const progressPercent = $derived(100);
	const nextUrl = $derived(
		stepIndex < POST_QUIZ_STEPS.length - 1
			? POST_QUIZ_STEPS[stepIndex + 1]
			: '/resultado'
	);
	const prevUrl = $derived(stepIndex > 0 ? POST_QUIZ_STEPS[stepIndex - 1] : '/resultado');

	const isCarregandoPage = $derived(pathname === '/carregando');
	const isNomePage = $derived(pathname === '/nome' || pathname.startsWith('/nome/'));
	const isWhatsappPage = $derived(pathname === '/whatsapp' || pathname.startsWith('/whatsapp/'));
	const isPrevisaoPage = $derived(pathname === '/previsao' || pathname.startsWith('/previsao/'));
	const isResultsPage = $derived(pathname === '/results' || pathname.startsWith('/results/'));
	/** Results: só logo no topo, sem voltar / CTA fixo */
	const hideNavOnThisPage = $derived(isResultsPage);
	const showCounterAndProgress = $derived(false);
	// Contagem continua do quiz (mr-4 = 13): nome=14, whatsapp=15, results=16
	const POST_QUIZ_COUNTER_START = 13;
	const headerCounter = $derived(POST_QUIZ_COUNTER_START + stepIndex + 1);

	const hasValidName = $derived(($postQuizStore.name || '').trim().length > 0);
	// WhatsApp obrigatório: só avança com telefone válido (10 ou 11 dígitos: DDD + número)
	// Valida número internacional: total de dígitos >= 9 (código do país + número local mínimo)
	const hasValidWhatsapp = $derived(
		($postQuizStore.whatsapp || '').replace(/\D/g, '').length >= 9
	);
	const canAdvance = $derived(
		(!isNomePage || hasValidName) && (!isWhatsappPage || hasValidWhatsapp)
	);

	/** Código do banner: # + 4 primeiras letras do nome + 4 últimos dígitos do telefone */
	const discountCode = $derived.by(() => {
		const name = ($postQuizStore.name || '').trim();
		const phone = ($postQuizStore.whatsapp || '').replace(/\D/g, '');
		const nameLetters = name
			.replace(/[^a-zA-ZÀ-Úà-ú]/g, '')
			.toLowerCase()
			.slice(0, 4);
		const phoneLast4 = phone.slice(-4);
		const part1 = nameLetters || 'user';
		const part2 = phoneLast4 || '0000';
		return '#' + part1 + part2;
	});

	// Scroll para pages não-results (scroll no container interno)
	function onScroll() {
		if (!scrollContainer || isResultsPage) return;
		showStickyBanner = scrollContainer.scrollTop >= STICKY_SCROLL_THRESHOLD;
	}

	// Results usa window scroll — sem lock no body, sem div scroll container
	$effect(() => {
		if (!browser || !isResultsPage) return;

		function onWindowScroll() {
			showStickyBanner = window.scrollY >= RESULTS_BANNER_SCROLL_THRESHOLD;
		}
		window.addEventListener('scroll', onWindowScroll, { passive: true });
		// Garante que o scroll começa do topo ao entrar na results
		window.scrollTo(0, 0);
		return () => window.removeEventListener('scroll', onWindowScroll);
	});

	// Quando sai da results (que usa window scroll), reseta o scroll do window
	$effect(() => {
		if (!browser || isResultsPage) return;
		window.scrollTo(0, 0);
	});

	/** Countdown da oferta: inicia ao entrar na página de resultados e para ao sair. */
	$effect(() => {
		if (!browser) return;
		const onResults = pathname === '/results' || pathname.startsWith('/results/');
		if (onResults) return startDiscountCountdown();
	});
</script>

{#if isResultsPage}
	<StickyDiscountBanner visible={showStickyBanner} discountCode={discountCode} />
{/if}
<div
	class="{isResultsPage ? 'post-quiz-results-scroll flex flex-col' : 'h-dvh flex flex-col overflow-hidden'}"
	bind:this={scrollContainer}
	onscroll={onScroll}
>
	<header class="shrink-0 px-4 {isResultsPage ? 'pt-3 pb-2' : 'pt-4 pb-3'}">
		<div class="relative flex items-center justify-between {isResultsPage ? 'mb-1.5' : 'mb-3'}">
			{#if !hideNavOnThisPage && !isCarregandoPage && !isResultsPage}
			<button
				type="button"
				onclick={() => goto(prevUrl)}
				class="w-9 h-9 flex items-center justify-center text-heading rounded-xl transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
				aria-label="Voltar"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M12 15L7 10l5-5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{:else}
			<div class="w-9 h-9 shrink-0" aria-hidden="true"></div>
			{/if}

			<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
				<Logo />
			</div>

			{#if showCounterAndProgress}
				<div
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent shrink-0"
					aria-label="Contagem"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--color-nutrition-green)] shrink-0" aria-hidden="true">
						<path
							d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
							fill="currentColor"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="text-sm text-muted font-medium tabular-nums min-w-[1ch]">{headerCounter}</span>
				</div>
			{:else}
				<div class="w-[59px] shrink-0" aria-hidden="true"></div>
			{/if}
		</div>

		{#if showCounterAndProgress}
		<StepProgressBar percent={progressPercent} steps={4} />
		{/if}
	</header>

	<main class="{isResultsPage ? 'flex flex-col' : 'flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar'}">
		<div class="content-transition-root">
			{#key pathname}
				<div
					in:fly={{ x: 30, duration: 260, delay: 40 }}
					out:fly={{ x: -30, duration: 180 }}
					class="content-transition-slot no-scrollbar max-w-lg mx-auto w-full px-4 {isResultsPage ? 'pt-2' : 'pt-4 overflow-y-auto overflow-x-hidden'} {isCarregandoPage || isResultsPage ? 'pb-2' : isNomePage || isWhatsappPage ? 'pb-32' : 'pb-8'}"
					style="pointer-events: auto;"
				>
					{@render children()}
				</div>
			{/key}
		</div>
	</main>

	{#if isNomePage || isWhatsappPage}
	<div class="fixed bottom-0 left-0 right-0">
		<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-8">
		<button
			type="button"
			onclick={() => goto(nextUrl)}
			disabled={!canAdvance}
			class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-on-primary transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:pointer-events-none"
		>
			<span>{isNomePage ? 'Continuar' : 'Ver Meu Plano'}</span>
			<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
			</svg>
		</button>
		</div>
	</div>
	{/if}
</div>

<style>
	:global(.no-scrollbar)::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
		scrollbar-gutter: none;
	}

	.content-transition-root {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		flex: 1;
		min-height: 0;
		width: 100%;
	}
	.content-transition-root > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
		min-height: 0;
		justify-self: center;
		align-self: stretch;
	}
	.content-transition-slot {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		min-height: 0;
		width: 100%;
		max-width: 32rem;
		box-sizing: border-box;
	}
	.content-transition-slot > * {
		min-height: 100%;
	}
	/* Results usa window scroll: sem min-height forçado (causaria espaço vazio extra) */
	.post-quiz-results-scroll .content-transition-slot > * {
		min-height: unset;
	}
</style>
