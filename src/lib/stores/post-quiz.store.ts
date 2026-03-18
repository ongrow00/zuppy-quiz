import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface PostQuizState {
	name: string;
	whatsapp: string;
}

const SESSION_KEY = 'zuppy-post-quiz-state';

const INITIAL: PostQuizState = {
	name: '',
	whatsapp: ''
};

function loadFromSession(): PostQuizState {
	if (!browser) return INITIAL;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return INITIAL;
		return JSON.parse(raw) as PostQuizState;
	} catch {
		return INITIAL;
	}
}

function saveToSession(state: PostQuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createPostQuizStore() {
	const { subscribe, set, update } = writable<PostQuizState>(loadFromSession());

	function persist(state: PostQuizState): PostQuizState {
		saveToSession(state);
		return state;
	}

	return {
		subscribe,

		setName(value: string) {
			update((s) => persist({ ...s, name: value }));
		},

		setWhatsapp(value: string) {
			update((s) => persist({ ...s, whatsapp: value }));
		},

		reset() {
			set(INITIAL);
			if (browser) sessionStorage.removeItem(SESSION_KEY);
		}
	};
}

export const postQuizStore = createPostQuizStore();
