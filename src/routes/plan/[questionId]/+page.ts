import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { quizConfig } from '$lib/data/quiz.config';

export const load: PageLoad = ({ params }) => {
	const { questionId } = params;

	// Validate questionId exists in config
	const question = quizConfig.questions.find((q) => q.id === questionId);
	if (!question) {
		redirect(302, '/');
	}

	// Guard: if no quiz state, redirect to landing (only client-side)
	if (browser) {
		try {
			const raw = sessionStorage.getItem('zuppy-quiz-state');
			if (!raw) redirect(302, '/');
			const state = JSON.parse(raw);
			if (!state.startedAt) redirect(302, '/');
		} catch {
			redirect(302, '/');
		}
	}

	return { questionId };
};
