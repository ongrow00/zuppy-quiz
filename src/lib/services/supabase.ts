import { browser } from '$app/environment';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { Answers, Scores, UtmParams } from '$lib/data/types';

let client: SupabaseClient | null = null;

export function initSupabase(): void {
	if (!browser) return;
	const url = env.PUBLIC_SUPABASE_URL;
	const key = env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) return;
	client = createClient(url, key);
}

function sb(): SupabaseClient | null {
	return client;
}

export function createSession(
	sessionId: string,
	startedAt: number,
	utm: UtmParams,
	offer: string | null
): void {
	sb()
		?.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				started_at: new Date(startedAt).toISOString(),
				utm,
				offer
			},
			{ onConflict: 'session_id' }
		)
		.then();
}

export function updateAnswers(
	sessionId: string,
	answers: Answers,
	scores: Scores,
	lastQuestionId: string,
	visitedQuestions: string[]
): void {
	sb()
		?.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				answers,
				scores,
				last_question_id: lastQuestionId,
				visited_questions: visitedQuestions
			},
			{ onConflict: 'session_id' }
		)
		.then();
}

export function completeSession(
	sessionId: string,
	completedAt: number,
	resultProfile: string | null
): void {
	sb()
		?.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				completed_at: new Date(completedAt).toISOString(),
				result_profile: resultProfile
			},
			{ onConflict: 'session_id' }
		)
		.then();
}

export function updateLead(
	sessionId: string,
	data: { name?: string; whatsapp?: string; email?: string }
): void {
	sb()
		?.from('quiz_sessions')
		.upsert({ session_id: sessionId, ...data }, { onConflict: 'session_id' })
		.then();
}

export function savePlanSelected(sessionId: string, planId: string): void {
	sb()
		?.from('quiz_sessions')
		.upsert(
			{
				session_id: sessionId,
				plan_selected: planId,
				checkout_initiated_at: new Date().toISOString()
			},
			{ onConflict: 'session_id' }
		)
		.then();
}
