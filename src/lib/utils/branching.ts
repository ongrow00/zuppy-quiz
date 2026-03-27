import type { Answers, BranchCondition, Question } from '$lib/data/types';

function evaluateCondition(condition: BranchCondition, answers: Answers): boolean {
	const answer = answers[condition.questionId];

	if (answer === undefined || answer === null) {
		// If not answered yet, treat as not matching
		return false;
	}

	const { operator, value } = condition;

	switch (operator) {
		case 'eq':
			if (Array.isArray(answer)) {
				return answer.includes(value as string);
			}
			return answer === value;

		case 'neq':
			if (Array.isArray(answer)) {
				return !answer.includes(value as string);
			}
			return answer !== value;

		case 'includes':
			if (Array.isArray(answer)) {
				const vals = Array.isArray(value) ? value : [value];
				return vals.every((v) => answer.includes(v));
			}
			return answer === value;

		case 'excludes':
			if (Array.isArray(answer)) {
				const vals = Array.isArray(value) ? value : [value];
				return !vals.some((v) => answer.includes(v));
			}
			return answer !== value;

		default:
			return false;
	}
}

export function isQuestionVisible(question: Question, answers: Answers): boolean {
	if (!question.showIf) return true;

	const { conditions, logic = 'AND' } = question.showIf;

	if (logic === 'AND') {
		return conditions.every((c) => evaluateCondition(c, answers));
	} else {
		return conditions.some((c) => evaluateCondition(c, answers));
	}
}

/** Objetivo é escolhido na home; a pergunta `goal_type` permanece no config para ramificações, mas não aparece no quiz. */
const HOME_ONLY_QUESTION_IDS = new Set(['goal_type']);

export function computeVisibleQuestions(questions: Question[], answers: Answers): Question[] {
	return questions
		.filter((q) => !HOME_ONLY_QUESTION_IDS.has(q.id))
		.filter((q) => isQuestionVisible(q, answers))
		.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
