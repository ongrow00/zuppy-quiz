import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import posthog from 'posthog-js';

export function initAnalytics(): void {
	if (!browser) return;
	posthog.init(PUBLIC_POSTHOG_KEY, {
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

function sendBeaconToPostHog(eventName: string, plan: string): void {
	const distinctId = posthog.get_distinct_id?.() ?? 'anonymous';
	const payload = JSON.stringify({
		api_key: PUBLIC_POSTHOG_KEY,
		batch: [
			{
				event: eventName,
				distinct_id: distinctId,
				properties: { plan, $lib: 'web' },
				timestamp: new Date().toISOString()
			}
		]
	});
	navigator.sendBeacon('https://us.i.posthog.com/batch/', new Blob([payload], { type: 'application/json' }));
}

export function trackCheckoutInitiated(plan: string, onDone: () => void): void {
	if (!browser) { onDone(); return; }
	// sendBeacon garante entrega mesmo após redirect — sem delay, sem callback
	sendBeaconToPostHog('checkout_initiated', plan);
	sendBeaconToPostHog(`checkout_initiated_${plan}`, plan);
	onDone();
}
