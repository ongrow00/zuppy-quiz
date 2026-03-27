import { browser } from '$app/environment';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { Answers, Scores, UtmParams } from '$lib/data/types';
import { quizConfig } from '$lib/data/quiz.config';

function resolveLabels(answers: Answers): Record<string, string | string[]> {
	const resolved: Record<string, string | string[]> = {};
	for (const [questionId, value] of Object.entries(answers)) {
		const question = quizConfig.questions.find((q) => q.id === questionId);
		if (!question?.options) {
			resolved[questionId] = value;
			continue;
		}
		if (Array.isArray(value)) {
			resolved[questionId] = value.map((v) => {
				const opt = question.options!.find((o) => o.id === v);
				return opt?.text ?? v;
			});
		} else {
			const opt = question.options.find((o) => o.id === value);
			resolved[questionId] = opt?.text ?? value;
		}
	}
	return resolved;
}

let client: SupabaseClient | null = null;

export function initSupabase(): void {
	if (!browser) return;
	const url = env.PUBLIC_SUPABASE_URL;
	const key = env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) return;
	client = createClient(url, key);
}

/** Garante cliente após layout ou no primeiro uso (evita corrida: clique antes do onMount do layout). */
function sb(): SupabaseClient | null {
	if (!browser) return null;
	if (!client) initSupabase();
	return client;
}

function logSupabaseError(op: string, err: { message: string } | null): void {
	if (!err) return;
	if (import.meta.env.DEV) {
		console.error(`[Supabase] ${op} failed:`, err.message, err);
	}
}

export function createSession(
	sessionId: string,
	startedAt: number,
	utm: UtmParams,
	offer: string | null
): void {
	const c = sb();
	if (!c) {
		if (import.meta.env.DEV) {
			console.warn(
				'[Supabase] createSession skipped: configure PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY'
			);
		}
		return;
	}
	void c
		.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				started_at: new Date(startedAt).toISOString(),
				utm,
				offer
			},
			{ onConflict: 'session_id' }
		)
		.then(({ error }) => logSupabaseError('createSession', error));
}

export function updateAnswers(
	sessionId: string,
	answers: Answers,
	scores: Scores,
	lastQuestionId: string,
	visitedQuestions: string[]
): void {
	const c = sb();
	if (!c) return;
	void c
		.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				answers: resolveLabels(answers),
				scores,
				last_question_id: lastQuestionId,
				visited_questions: visitedQuestions
			},
			{ onConflict: 'session_id' }
		)
		.then(({ error }) => logSupabaseError('updateAnswers', error));
}

export function completeSession(
	sessionId: string,
	completedAt: number,
	resultProfile: string | null
): void {
	const c = sb();
	if (!c) return;
	void c
		.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				completed_at: new Date(completedAt).toISOString(),
				result_profile: resultProfile
			},
			{ onConflict: 'session_id' }
		)
		.then(({ error }) => logSupabaseError('completeSession', error));
}

export function updateLead(
	sessionId: string,
	data: { name?: string; whatsapp?: string; email?: string }
): void {
	const c = sb();
	if (!c) return;
	void c
		.from('quiz_sessions')
		.upsert({ session_id: sessionId, ...data }, { onConflict: 'session_id' })
		.then(({ error }) => logSupabaseError('updateLead', error));
}

export function savePlanSelected(sessionId: string, planId: string): void {
	const c = sb();
	if (!c) return;
	void c
		.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				plan_selected: planId,
				checkout_initiated_at: new Date().toISOString()
			},
			{ onConflict: 'session_id' }
		)
		.then(({ error }) => logSupabaseError('savePlanSelected', error));
}
