<script lang="ts">
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { quizStore, currentQuestion, quizNavigationEnded } from '$lib/stores/quiz.store';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import QuizShell from '$lib/components/quiz/QuizShell.svelte';

	// Guard inicial: redireciona para home se o quiz não foi iniciado (ex.: refresh direto na URL)
	onMount(() => {
		const state = get(quizStore);
		if (!state.startedAt) {
			goto('/', { replaceState: true });
			return;
		}
		if (!state.answers['goal_type']) {
			goto('/', { replaceState: true });
			return;
		}
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		if (state.currentQuestionId && !visible.some((q) => q.id === state.currentQuestionId)) {
			const first = visible[0];
			if (first) {
				quizStore.goTo(first.id);
				goto(`/plan/${first.id}`, { replaceState: true });
			}
		}
	});

	// Sincroniza store com URL após navegação (refresh, link direto, browser back/forward, avançar/voltar).
	afterNavigate(({ to }) => {
		const qid = to?.params?.questionId;
		if (qid) quizNavigationEnded.update((n) => n + 1); // rede de segurança: libera lock advancing
		if (!qid) return;
		const state = get(quizStore);
		if (state.currentQuestionId === qid) return;
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		if (visible.some((q) => q.id === qid)) {
			quizStore.goTo(qid);
		} else if (state.currentQuestionId && visible.some((q) => q.id === state.currentQuestionId)) {
			const targetPath = `/plan/${state.currentQuestionId}`;
			if (to?.url?.pathname !== targetPath) {
				goto(targetPath, { replaceState: true });
			}
		} else {
			// URL e store inválidos (ex.: link antigo) — vai para primeira visível ou home
			const first = visible[0];
			if (first) {
				quizStore.goTo(first.id);
				goto(`/plan/${first.id}`, { replaceState: true });
			} else {
				goto('/', { replaceState: true });
			}
		}
	});
</script>

<svelte:head>
	<title>Zuppy</title>
</svelte:head>

{#if $currentQuestion}
	<QuizShell />
{/if}
