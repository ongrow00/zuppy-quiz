import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (browser) {
		try {
			const raw = sessionStorage.getItem('zuppy-quiz-state');
			if (!raw) redirect(302, '/');
			const state = JSON.parse(raw);
			const hasAnswers = state.answers && Object.keys(state.answers).length > 0;
			if (!hasAnswers) redirect(302, '/');
		} catch {
			redirect(302, '/');
		}
	}

	return {};
};
