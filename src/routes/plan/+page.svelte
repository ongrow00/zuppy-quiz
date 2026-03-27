<script lang="ts">
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { onMount } from 'svelte';

	onMount(() => {
		const state = $quizStore;
		if (!state.startedAt) {
			goto('/', { replaceState: true });
			return;
		}
		if (!state.answers['goal_type']) {
			goto('/', { replaceState: true });
			return;
		}
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const firstQuestion = visible[0];
		if (firstQuestion) goto(`/plan/${firstQuestion.id}`, { replaceState: true });
	});
</script>
