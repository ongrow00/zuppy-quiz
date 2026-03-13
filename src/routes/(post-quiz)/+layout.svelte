<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';

	let { children } = $props();

	const POST_QUIZ_STEPS = ['/carregando', '/nome', '/whatsapp', '/results'] as const;

	const pathname = $derived($page.url.pathname);
	const currentIndex = $derived(
		POST_QUIZ_STEPS.findIndex((p) => pathname === p || pathname.startsWith(p + '/'))
	);
	const stepIndex = $derived(currentIndex >= 0 ? currentIndex : 0);
	// Nome, WhatsApp e results: barra sempre 100%
	const progressPercent = $derived(
		stepIndex >= 1 ? 100 : ((stepIndex + 1) / POST_QUIZ_STEPS.length) * 100
	);
	const nextUrl = $derived(
		stepIndex < POST_QUIZ_STEPS.length - 1
			? POST_QUIZ_STEPS[stepIndex + 1]
			: '/resultado'
	);
	const prevUrl = $derived(stepIndex > 0 ? POST_QUIZ_STEPS[stepIndex - 1] : '/resultado');

	const isCarregandoPage = $derived(pathname === '/carregando');
	const isWhatsappPage = $derived(pathname === '/whatsapp' || pathname.startsWith('/whatsapp/'));
	const isResultsPage = $derived(pathname === '/results' || pathname.startsWith('/results/'));
	const hideNavOnThisPage = $derived(isResultsPage);
	// Contagem continua do quiz (mr-5 = 13): nome=14, whatsapp=15, results=16
	const POST_QUIZ_COUNTER_START = 13;
	const headerCounter = $derived(stepIndex >= 1 ? POST_QUIZ_COUNTER_START + stepIndex : 0);
</script>

<div class="min-h-screen flex flex-col bg-bg">
	<header class="bg-bg px-4 pt-4 pb-3 {!isResultsPage ? 'sticky top-0 z-10' : ''}">
		<div class="relative flex items-center justify-between mb-3">
			{#if !hideNavOnThisPage && !isCarregandoPage}
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

			{#if !hideNavOnThisPage && !isCarregandoPage}
				<div
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent shrink-0"
					aria-label="Contagem"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
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

		{#if !hideNavOnThisPage && !isCarregandoPage}
		<StepProgressBar percent={progressPercent} steps={4} />
		{/if}
	</header>

	<main class="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
		<div class="content-transition-root">
			{#key pathname}
				<div
					in:fly={{ x: 30, duration: 260, delay: 40 }}
					out:fly={{ x: -30, duration: 180 }}
					class="content-transition-slot max-w-lg mx-auto w-full px-4 pt-8 {isCarregandoPage ? 'pb-8' : hideNavOnThisPage ? 'pb-8' : 'pb-32'}"
					style="pointer-events: auto;"
				>
					{@render children()}
				</div>
			{/key}
		</div>
	</main>

	{#if !hideNavOnThisPage && !isCarregandoPage}
	<div class="fixed bottom-0 left-0 right-0 bg-bg">
		<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-8">
		<button
			type="button"
			onclick={() => goto(nextUrl)}
			class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg {isWhatsappPage ? 'post-quiz-cta' : ''}"
		>
			{#if isWhatsappPage}
				<span>Desbloquear</span>
				<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			{:else}
				<span>Continuar</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
				</svg>
			{/if}
		</button>
		</div>
	</div>
	{/if}
</div>

<style>
	.content-transition-root {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		flex: 1;
		min-height: 0;
	}
	.content-transition-root > * {
		grid-row: 1;
		grid-column: 1;
	}
	.content-transition-slot {
		display: flex;
		flex-direction: column;
		overflow: visible;
	}

	.post-quiz-cta {
		position: relative;
		overflow: hidden;
	}
	.post-quiz-cta::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 60%;
		background: linear-gradient(
			100deg,
			transparent 0%,
			transparent 40%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 60%,
			transparent 100%
		);
		animation: post-quiz-cta-shimmer 2.5s ease-in-out infinite;
		pointer-events: none;
		border-radius: inherit;
	}
	@keyframes post-quiz-cta-shimmer {
		0% {
			transform: translateX(-100%) skewX(-12deg);
		}
		100% {
			transform: translateX(200%) skewX(-12deg);
		}
	}
</style>
