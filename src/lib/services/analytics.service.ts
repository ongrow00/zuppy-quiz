import { browser } from '$app/environment';
import posthog from 'posthog-js';

export function initAnalytics(): void {
	if (!browser) return;
	posthog.init('phc_3rPOK6XJFPpjHVf2LcqLquRic7bErVVSe2vYPVeAsJM', {
		api_host: 'https://us.i.posthog.com',
		capture_pageview: false,
		persistence: 'localStorage'
	});
}

export function trackQuizLanded(): void {
	if (!browser) return;
	posthog.capture('quiz_landed');
}

export function trackQuizStart(): void {
	if (!browser) return;
	posthog.capture('quiz_started');
}

export function trackQuestionAnswer(questionId: string, optionId: string | string[]): void {
	if (!browser) return;
	posthog.capture('question_answered', { question_id: questionId, value: optionId });
}

export function trackMr1Passed(): void {
	if (!browser) return;
	posthog.capture('quiz_mr1_passed');
}

export function trackMr2Passed(): void {
	if (!browser) return;
	posthog.capture('quiz_mr2_passed');
}

export function trackMr3Passed(): void {
	if (!browser) return;
	posthog.capture('quiz_mr3_passed');
}

export function trackMr4Passed(): void {
	if (!browser) return;
	posthog.capture('quiz_mr4_passed');
}

export function trackQuizComplete(): void {
	if (!browser) return;
	posthog.capture('quiz_completed');
}

export function trackLeadName(): void {
	if (!browser) return;
	posthog.capture('lead_name_submitted');
}

export function trackLeadWhatsApp(whatsapp: string): void {
	if (!browser) return;
	posthog.identify(whatsapp);
	posthog.capture('lead_whatsapp_submitted');
}

export function trackResultsViewed(goal: string): void {
	if (!browser) return;
	posthog.capture('results_viewed', { goal });
}

export function trackPlanSelected(plan: string): void {
	if (!browser) return;
	posthog.capture('plan_selected', { plan });
}

export function trackCheckoutInitiated(plan: string, onDone: () => void): void {
	if (!browser) { onDone(); return; }
	let done = false;
	const proceed = () => { if (!done) { done = true; onDone(); } };
	setTimeout(proceed, 1500);
	posthog.capture('checkout_initiated', {}, { send_instantly: true });
	posthog.capture(`checkout_initiated_${plan}`, {}, { send_instantly: true, callback: proceed });
}
