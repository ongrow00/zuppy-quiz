import { browser } from '$app/environment';
import { derived, get, writable } from 'svelte/store';
import { quizConfig } from '$lib/data/quiz.config';
import type { Answers, CategoryKey, Question, QuizState, Scores } from '$lib/data/types';
import { computeVisibleQuestions } from '$lib/utils/branching';
import { calculateScores, matchProfile } from '$lib/utils/scoring';
import { sessionStore } from '$lib/stores/session.store';
import { createSession, completeSession } from '$lib/services/supabase';

const SESSION_KEY = 'zuppy-quiz-state';

const INITIAL_SCORES: Scores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

const INITIAL_STATE: QuizState = {
	currentQuestionId: null,
	answers: {},
	scores: { ...INITIAL_SCORES },
	visitedQuestions: [],
	startedAt: null,
	completedAt: null,
	quizSessionId: null
};

function loadFromSession(): QuizState {
	if (!browser) return INITIAL_STATE;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return INITIAL_STATE;
		return JSON.parse(raw) as QuizState;
	} catch {
		return INITIAL_STATE;
	}
}

function saveToSession(state: QuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createQuizStore() {
	const { subscribe, set, update } = writable<QuizState>(loadFromSession());

	function persist(state: QuizState): QuizState {
		saveToSession(state);
		return state;
	}

	return {
		subscribe,

		start() {
			const visible = computeVisibleQuestions(quizConfig.questions, {});
			const firstQuestion = visible[0] ?? null;
			const sessionId = browser ? crypto.randomUUID() : null;
			const startedAt = Date.now();
			update((s) =>
				persist({
					...INITIAL_STATE,
					currentQuestionId: firstQuestion?.id ?? null,
					startedAt,
					quizSessionId: sessionId
				})
			);
			if (sessionId) {
				const { utm, offer } = get(sessionStore);
				createSession(sessionId, startedAt, utm, offer);
			}
		},

		answer(questionId: string, value: string | string[]) {
			update((s) => {
				const newAnswers = { ...s.answers, [questionId]: value };
				const newScores = calculateScores(newAnswers, quizConfig.questions);

				// Mark as visited if not already
				const visited = s.visitedQuestions.includes(questionId)
					? s.visitedQuestions
					: [...s.visitedQuestions, questionId];

				return persist({ ...s, answers: newAnswers, scores: newScores, visitedQuestions: visited });
			});
		},

		goTo(questionId: string) {
			update((s) => persist({ ...s, currentQuestionId: questionId }));
		},

		complete() {
			update((s) => {
				const completedAt = Date.now();
				const next = persist({ ...s, completedAt });
				if (next.quizSessionId) {
					const profile = matchProfile(next.scores, quizConfig.profiles);
					completeSession(next.quizSessionId, completedAt, profile?.id ?? null);
				}
				return next;
			});
		},

		reset() {
			const fresh = { ...INITIAL_STATE };
			saveToSession(fresh);
			set(fresh);
		}
	};
}

export const quizStore = createQuizStore();

/** Bumped when navigation has ended (afterNavigate). QuizShell uses this to clear advancing lock. */
export const quizNavigationEnded = writable(0);

// --- Derived stores ---

export const visibleQuestions = derived(quizStore, ($quiz) =>
	computeVisibleQuestions(quizConfig.questions, $quiz.answers)
);

export const currentQuestion = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): Question | null =>
		$visible.find((q) => q.id === $quiz.currentQuestionId) ?? null
);

export const currentIndex = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): number => $visible.findIndex((q) => q.id === $quiz.currentQuestionId)
);

// 4 MRs em ordem de aparição no quiz → 4 segmentos → 4 checkpoints na barra
const PROGRESS_MILESTONE_IDS = ['mr-1', 'mr-2', 'mr-3', 'mr-4'] as const;
const TOTAL_SEGMENTS = 4;

export const progressPercent = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): number => {
		if ($visible.length === 0 || $index < 0) return 0;

		const milestoneIndices = PROGRESS_MILESTONE_IDS.map((id) =>
			$visible.findIndex((q) => q.id === id)
		);

		// Fallback: sem milestones, progresso linear
		if (milestoneIndices.every((i) => i < 0)) {
			return Math.round((($index + 1) / $visible.length) * 100);
		}

		// Na tela do MR: retorna exatamente o % do checkpoint correspondente
		const currentId = $visible[$index]?.id;
		const milestoneSegment = PROGRESS_MILESTONE_IDS.findIndex((id) => id === currentId);
		if (milestoneSegment >= 0) {
			return Math.round(((milestoneSegment + 1) / TOTAL_SEGMENTS) * 100);
		}

		// Determina em qual segmento estamos
		let segment = TOTAL_SEGMENTS - 1;
		for (let s = 0; s < milestoneIndices.length; s++) {
			if (milestoneIndices[s] >= 0 && $index <= milestoneIndices[s]) {
				segment = s;
				break;
			}
		}

		const segmentStart = segment === 0 ? 0 : milestoneIndices[segment - 1] + 1;
		const segmentEnd =
			segment < milestoneIndices.length ? milestoneIndices[segment] : $visible.length - 1;
		const segmentSize = segmentEnd - segmentStart;
		const progressWithin = segmentSize > 0 ? ($index - segmentStart) / segmentSize : 1;

		return Math.min(100, Math.round(((segment + progressWithin) / TOTAL_SEGMENTS) * 100));
	}
);

export const isFirstQuestion = derived(currentIndex, ($index) => $index === 0);

export const isLastQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]) => $index === $visible.length - 1
);

export const nextQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => $visible[$index + 1] ?? null
);

export const prevQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => ($index > 0 ? $visible[$index - 1] : null)
);
