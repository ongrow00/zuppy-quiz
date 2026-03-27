<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart } from '$lib/services/analytics.service';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import OptionButton from '$lib/components/quiz/OptionButton.svelte';
	import GlowBorderFrame from '$lib/components/ui/GlowBorderFrame.svelte';

	type GoalOptionId = 'goal-emagrecer' | 'goal-massa';

	const goalHomeOptions = [
		{ id: 'goal-emagrecer' as const, text: 'Quero Emagrecer', imageUrl: '/assets/quero-emagrecer.png' },
		{ id: 'goal-massa' as const, text: 'Quero Ganhar Massa', imageUrl: '/assets/quero-ganhar-massa.png' }
	];

	let transitioning = $state(false);
	let mainEl = $state<HTMLElement | null>(null);
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
		return () => {
			window.removeEventListener('scroll', updateShowFooter);
		};
	});

	async function startQuizWithGoal(goalId: GoalOptionId) {
		if (transitioning) return;
		transitioning = true;
		await new Promise((r) => setTimeout(r, 450));
		quizStore.start(goalId);
		trackQuizStart();
		fbq('track', 'AddToWishlist');
		const { currentQuestionId } = get(quizStore);
		if (currentQuestionId) goto(`/plan/${currentQuestionId}`);
	}

	function handleGoalOptionClick(optionId: string) {
		if (optionId === 'goal-emagrecer' || optionId === 'goal-massa') {
			startQuizWithGoal(optionId);
		}
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
		class="flex-1 flex flex-col items-center px-4 pt-[50px] pb-[calc(6.5rem+env(safe-area-inset-bottom))] min-h-0 overflow-y-auto"
	>
		<div class="flex-1 flex flex-col justify-center w-full max-w-lg">
			<div class="text-center flex flex-col items-center gap-1">
				<div class="flex flex-col items-center gap-6 w-full">
					<h1 class="text-2xl md:text-3xl font-normal text-heading leading-[1.1] relative z-10">
						Escolha seu objetivo e receba <strong class="font-bold text-accent">grátis</strong> um <strong class="font-bold text-accent">plano de calorias</strong> <strong class="font-bold text-accent">sob medida</strong> para <strong class="font-bold text-accent">o seu corpo</strong>.
					</h1>
					<p class="text-[14px] text-body/80 leading-[1.1]">
						Descubra exatamente quantas <strong class="font-bold text-heading">calorias</strong> você precisa para
						emagrecer, ganhar massa e <strong class="font-bold text-heading">acelerar seu metabolismo</strong>.
					</p>
					<div class="flex flex-row gap-2 w-full max-w-lg mx-auto [zoom:0.8]">
						{#each goalHomeOptions as option, i (option.id)}
							<div class="option-cascade flex-1 min-w-0" style="animation-delay: {80 + i * 55}ms">
								<GlowBorderFrame class="w-full">
									<OptionButton
										option={{ id: option.id, text: option.text, scores: {}, imageUrl: option.imageUrl }}
										selected={false}
										horizontal={true}
										horizontalImageClass="object-contain"
										optionTitleClass="font-bold text-[16px] leading-[1.1]"
										onclick={handleGoalOptionClick}
									/>
								</GlowBorderFrame>
							</div>
						{/each}
					</div>
					<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 w-full">
						<p class="flex items-center gap-1.5 text-[12px] text-muted">
							<svg class="w-3 h-3 shrink-0 text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
							</svg>
							100% seguro
						</p>
						<p class="flex items-center gap-1.5 text-[12px] text-muted">
							<svg class="w-3 h-3 shrink-0 text-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
							</svg>
							Limitado a 1 por pessoa
						</p>
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

<!-- Prova social fixa no rodapé — fora do div com transform para position:fixed estável -->
<div class="fixed bottom-0 left-0 right-0 z-[60]">
	<div class="max-w-lg mx-auto w-full px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 flex justify-center">
		<SocialProof />
	</div>
</div>

<style>
	/* Mesmo padrão de entrada que QuestionCard (opções do quiz) */
	.option-cascade {
		opacity: 0;
		animation: option-in 220ms ease forwards;
	}
	@keyframes option-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
