<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { quizStore } from '$lib/stores/quiz.store';
	import { sessionStore } from '$lib/stores/session.store';
	import Logo from '$lib/components/ui/Logo.svelte';

	const quiz = $derived($quizStore);
	/** Use for conditional offer/variant content (e.g. ?offer=plano-premium) */
	const offer = $derived($sessionStore.offer);

	onMount(() => {
		if (!Object.keys(quiz.answers).length) {
			goto('/', { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Zuppy</title>
</svelte:head>

<div class="min-h-screen pb-16">
	<header class="sticky top-0 z-10 flex justify-center pt-6 pb-4 px-4 bg-bg">
		<Logo class="text-heading" />
	</header>
	<main class="max-w-lg mx-auto px-4 pt-4 flex flex-col items-center">
		<!-- Quadrado 1:1 com play no centro -->
		<div
			class="relative w-full aspect-square max-w-lg mx-auto rounded-xl bg-surface border border-line overflow-hidden flex items-center justify-center"
			aria-label="Player de vídeo"
		>
			<button
				type="button"
				class="w-16 h-16 rounded-full bg-surface-2 text-heading flex items-center justify-center border-2 border-line hover:bg-accent hover:text-on-primary hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				aria-label="Reproduzir"
			>
				<svg class="w-8 h-8 ml-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7L8 5z" />
				</svg>
			</button>
		</div>
	</main>
</div>
