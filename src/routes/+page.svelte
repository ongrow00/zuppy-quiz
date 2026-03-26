<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { AnimationItem } from 'lottie-web';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart } from '$lib/services/analytics.service';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';

	const firstQuestion = $derived(computeVisibleQuestions(quizConfig.questions, {})[0]);

	let transitioning = $state(false);
	let mainEl = $state<HTMLElement | null>(null);
	let heroLottieEl = $state<HTMLDivElement | null>(null);
	let showFooter = $state(false);
	const SCROLL_THRESHOLD = 80;

	function updateShowFooter() {
		const windowY = typeof window !== 'undefined' ? window.scrollY ?? document.documentElement.scrollTop : 0;
		const mainScroll = mainEl?.scrollTop ?? 0;
		showFooter = windowY > SCROLL_THRESHOLD || mainScroll > SCROLL_THRESHOLD;
	}

	onMount(() => {
		updateShowFooter();
		window.addEventListener('scroll', updateShowFooter, { passive: true });

		let heroAnim: AnimationItem | null = null;
		if (heroLottieEl) {
			const el = heroLottieEl;
			import('lottie-web').then(({ default: lottie }) => {
				heroAnim = lottie.loadAnimation({
					container: el,
					renderer: 'svg',
					loop: true,
					autoplay: true,
					path: '/assets/home-headline-lottie.json'
				});
			});
		}

		return () => {
			window.removeEventListener('scroll', updateShowFooter);
			heroAnim?.destroy();
		};
	});

	async function startQuiz() {
		if (transitioning) return;
		transitioning = true;
		await new Promise((r) => setTimeout(r, 450));
		quizStore.start();
		trackQuizStart();
		fbq('track', 'AddToWishlist');
		if (firstQuestion) goto(`/plan/${firstQuestion.id}`);
	}
</script>

<svelte:head>
	<title>Zuppy</title>
</svelte:head>

<!-- Overlay de transição: fade para o fundo -->
<div
	class="fixed inset-0 z-50 pointer-events-none transition-opacity duration-[450ms] ease-in-out"
	style="opacity: {transitioning ? 1 : 0}; background: linear-gradient(to bottom, rgba(142, 211, 58, 0.1) 0%, rgba(142, 211, 58, 0) 100%), #f2f2f7;"
></div>

<div
	class="min-h-screen flex flex-col transition-[opacity,transform] duration-[350ms] ease-in-out"
	style="opacity: {transitioning ? 0 : 1}; transform: {transitioning ? 'scale(0.97)' : 'scale(1)'}"
>
	<!-- Logo fixada no topo -->
	<header class="sticky top-0 z-10 flex justify-center pt-6 px-4 bg-transparent">
		<Logo />
	</header>

	<!-- Conteúdo centralizado na tela; rodapé só aparece ao rolar -->
	<main
		bind:this={mainEl}
		onscroll={updateShowFooter}
		class="flex-1 flex flex-col items-center px-4 pt-[50px] pb-40 min-h-0 overflow-y-auto"
	>
		<div class="flex-1 flex flex-col justify-center w-full max-w-lg">
			<div class="text-center flex flex-col items-center gap-1">
				<div
					bind:this={heroLottieEl}
					class="fitness-lottie-wrapper w-full max-w-[min(100%,9.8rem)] mx-auto aspect-[708/480] flex items-center justify-center min-h-0 overflow-hidden p-0"
					aria-hidden="true"
				></div>
				<div class="flex flex-col items-center gap-6 w-full">
					<h1 class="text-2xl md:text-3xl font-normal text-heading leading-[1.1] relative z-10">
						Receba um <strong class="font-bold text-accent">plano de calorias</strong> criado para <strong class="font-bold text-accent">seu corpo</strong> nos <strong class="font-bold text-accent">próximos minutos</strong>.
					</h1>
					<p class="text-sm text-body/80 leading-[14px]">
						Responda algumas perguntas e descubra exatamente <strong class="font-bold text-accent">quanto e o que comer por dia</strong> para transformar seu corpo de <strong class="font-bold text-accent">acordo com seu biotipo</strong> sem abrir mão do que você gosta.
					</p>
					<div class="flex justify-center">
						<SocialProof onClick={startQuiz} />
					</div>
				</div>
			</div>
		</div>

		<!-- Espaço para que o rodapé fique abaixo da dobra -->
		<div class="w-full min-h-[45vh]" aria-hidden="true"></div>

		<!-- Footer (só visível após o usuário rolar a tela; some ao voltar) -->
		<footer
			class="w-full max-w-lg mx-auto text-left pt-4 border-t border-line mt-2 transition-opacity duration-300 ease-out"
			class:opacity-0={!showFooter}
			class:pointer-events-none={!showFooter}
			class:invisible={!showFooter}
			aria-hidden={!showFooter}
		>
				<p class="text-[10px] text-muted/60 leading-none mb-1">© 2026 Zuppy. Todos os direitos reservados.</p>
				<p class="text-[10px] text-muted/60 leading-none mb-4">CNPJ: 46.737.539/0001-29</p>
				<p class="text-[10px] text-muted/60 leading-relaxed mb-4">
					Este site não é afiliado ao Facebook™, Google™ ou qualquer plataforma de mídia. Após sair dessas plataformas, a responsabilidade é exclusivamente deste site.
				</p>
				<p class="text-[10px] text-muted/60 leading-relaxed mb-4">
					Os resultados podem variar de pessoa para pessoa. As informações disponibilizadas possuem caráter educativo e não substituem orientação médica ou profissional.
				</p>
				<p class="text-[10px] text-muted/60 leading-relaxed mb-5">
					Ao utilizar este site você concorda com nossos Termos de Uso e Política de Privacidade.
				</p>
				<div class="flex flex-wrap gap-x-3 gap-y-1">
					<a href="https://zuppy.me/terms/use" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Termos de Uso</a>
					<span class="text-[10px] text-muted/30">|</span>
					<a href="https://zuppy.me/terms/privacy" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Política de Privacidade</a>
					<span class="text-[10px] text-muted/30">|</span>
					<a href="https://zuppy.me/terms/subscription" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Política de Assinatura</a>
					<span class="text-[10px] text-muted/30">|</span>
					<a href="https://zuppy.me/terms/refund" target="_blank" rel="noopener" class="text-[10px] text-muted/50 hover:text-muted transition-colors">Garantia de Reembolso</a>
					<span class="text-[10px] text-muted/30">|</span>
					<a href="mailto:rodrigo@zuppy.me" class="text-[10px] text-muted/50 hover:text-muted transition-colors">rodrigo@zuppy.me</a>
				</div>
		</footer>
	</main>

</div>

<!-- Botão fixo no rodapé — fora do div com transform para manter position:fixed real -->
<div class="fixed bottom-0 left-0 right-0 z-[60]">
	<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
	<button
		type="button"
		onclick={startQuiz}
		class="cta-shimmer w-full h-16 rounded-[16px] bg-accent transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg relative overflow-hidden flex items-center justify-center px-6"
	>
		<span class="relative z-10 font-bold text-base text-on-primary">Iniciar Plano Grátis</span>
	</button>
		<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3">
			<p class="flex items-center gap-1.5 text-[10px] text-muted">
				<svg class="w-3 h-3 shrink-0 text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
				</svg>
				100% seguro
			</p>
			<p class="flex items-center gap-1.5 text-[10px] text-muted">
				<svg class="w-3 h-3 shrink-0 text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
				</svg>
				Limitado a 1 por pessoa
			</p>
		</div>
	</div>
</div>

<style>
	/* Promove o botão ao compositor para que o ::after animado (dentro de overflow:hidden)
	   também seja composto na GPU, evitando repaint no main thread */
	.cta-shimmer {
		will-change: transform;
	}

	/* translateX no compositor (evita animar background-position) */
	.cta-shimmer::after {
		content: '';
		position: absolute;
		top: 0;
		left: -55%;
		width: 55%;
		height: 100%;
		background: linear-gradient(
			105deg,
			transparent 0%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 100%
		);
		animation: cta-shimmer-x 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes cta-shimmer-x {
		0% {
			transform: translateX(-10%);
		}
		100% {
			transform: translateX(320%);
		}
	}
</style>
