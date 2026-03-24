<script lang="ts">
	import { tick } from 'svelte';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import {
		quizStore,
		currentQuestion,
		isLastQuestion,
		nextQuestion,
		quizNavigationEnded
	} from '$lib/stores/quiz.store';
	import { trackQuestionAnswer, trackQuizComplete, trackMr1Passed, trackMr2Passed, trackMr3Passed, trackMr4Passed } from '$lib/services/analytics.service';
	import { updateAnswers } from '$lib/services/supabase';
	import QuestionCard from './QuestionCard.svelte';
	import InfoScreen from './InfoScreen.svelte';
	import MicroResultScreen from './MicroResultScreen.svelte';
	import FeatureInfoScreen from './FeatureInfoScreen.svelte';
	import QuestionInputNumber from './QuestionInputNumber.svelte';
	import QuestionInputDate from './QuestionInputDate.svelte';
	import QuestionInputText from './QuestionInputText.svelte';
	import QuestionSlider from './QuestionSlider.svelte';
	import QuestionRuler from './QuestionRuler.svelte';
	import QuestionWeightCurrent from './QuestionWeightCurrent.svelte';
	import QuestionWeightGoal from './QuestionWeightGoal.svelte';
	import QuestionBodyFatGrid from './QuestionBodyFatGrid.svelte';
	import TransitionWrapper from './TransitionWrapper.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { getMicroResultData } from '$lib/utils/microresult-data';

	const quiz = $derived($quizStore);
	const question = $derived($currentQuestion);
	const isLast = $derived($isLastQuestion);
	const next = $derived($nextQuestion);

	// Gendered text substitution: resolve "pronto(a)" → "pronto" or "pronta"
	const isMale = $derived(quiz.answers['gender'] === 'gender-m');
	const genderKnown = $derived(
		quiz.answers['gender'] === 'gender-m' || quiz.answers['gender'] === 'gender-f'
	);
	function normalizeGrammar(text: string): string {
		// Ex.: "um. Casamento" -> "um, Casamento"
		return text.replace(/\b([Uu]m)\.\s+/g, '$1, ');
	}
	function g(text: string): string {
		const withGender = genderKnown ? text.replace(/o\(a\)/g, isMale ? 'o' : 'a') : text;
		return normalizeGrammar(withGender);
	}
	// Genderized version of the current question (text, subtext, option texts/descriptions)
	const gq = $derived.by(() => {
		if (!question) return question;
		return {
			...question,
			text: g(question.text),
			subtext: question.subtext ? g(question.subtext) : question.subtext,
			options: question.options?.map((opt) => ({
				...opt,
				text: g(opt.text),
				description: opt.description ? g(opt.description) : opt.description
			}))
		} as typeof question;
	});

	// body_fat_grid uses a slider + Continuar; no auto-advance on every slider move
	const isSingleChoiceQuestion = $derived(
		question?.type === 'single' ||
			question?.type === 'boolean' ||
			question?.type === 'scale'
	);

	const isInfoOrMicroResult = $derived(
		question?.type === 'info' || question?.type === 'microresult' || question?.type === 'feature_info'
	);

	const currentAnswer = $derived(question ? quiz.answers[question.id] : undefined);

	/** Para body_fat_goal / body_goal_visual: estágio "antes" = resposta de body_fat_level / body_current (0..5). */
	const bodyFatBeforeStage = $derived.by(() => {
		if (question?.id === 'body_fat_goal') {
			const v = quiz.answers['body_fat_level'];
			if (typeof v !== 'string') return undefined;
			const n = parseInt(v, 10);
			return Number.isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
		}
		if (question?.id === 'body_goal_visual') {
			const v = quiz.answers['body_current'];
			if (typeof v !== 'string') return undefined;
			const n = parseInt(v, 10);
			return Number.isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
		}
		return undefined;
	});
	const hasValidAnswer = $derived(
		currentAnswer !== undefined &&
			(Array.isArray(currentAnswer)
				? currentAnswer.length > 0
				: typeof currentAnswer === 'string'
					? currentAnswer.trim() !== ''
					: true)
	);
	const canGoNext = $derived(
		question
			? isInfoOrMicroResult
				? true
				: question.required
					? hasValidAnswer
					: true
			: false
	);

	const showNextButton = $derived(!isSingleChoiceQuestion);

	/**
	 * Delay do botão na cascata.
	 * Conteúdo fica totalmente visível em ~1700ms (chart entra em 800ms, dur 900ms).
	 * Pausa intencional de ~1100ms depois → botão aparece em 2800ms.
	 * Isso cria um momento de "assimilação" antes do CTA surgir.
	 */
	const buttonCascadeDelay = $derived.by(() => {
		if (question?.type !== 'microresult' || !question) return 0;
		// mr-4: botão aparece assim que as barras terminam (delay 0; visibilidade controlada por mr4LoadingComplete)
		if (question.id === 'mr-4') return 0;
		// mr-2 com cardio: cardio box entra em ~1400ms, botão espera mais 800ms
		if (question.id === 'mr-2') {
			const data = getMicroResultData(question.id, quiz.answers, quizConfig.questions);
			const nexo = data?.nexo as { variant?: string; showCardioBox?: boolean } | undefined;
			return nexo?.showCardioBox ? 1600 : 1400;
		}
		return 1400; // mr-1, mr-3, mr-5
	});

	/** Lock para evitar duplo clique em Continuar */
	let advancing = $state(false);

	/** mr-4: botão Continuar só aparece quando a última barra de carregamento termina */
	let mr4LoadingComplete = $state(false);
	$effect(() => {
		if (question?.id !== 'mr-4') mr4LoadingComplete = false;
	});

	// Rede de segurança: quando a navegação termina (afterNavigate), limpa o lock advancing
	$effect(() => {
		$quizNavigationEnded; // track store so effect re-runs when it's bumped
		advancing = false;
	});

	// Timeout de segurança: se advancing ficar true por muito tempo (ex.: goto nunca resolve), libera a UI
	const ADVANCING_TIMEOUT_MS = 4000;
	$effect(() => {
		if (!advancing) return;
		const t = setTimeout(() => {
			advancing = false;
		}, ADVANCING_TIMEOUT_MS);
		return () => clearTimeout(t);
	});

	// event_date: show selected event name instead of "evento" (e.g. "Qual é a data do casamento?")
	const eventDateTitle = $derived.by(() => {
		if (question?.id !== 'event_date') return undefined;
		const eventTypeId = quiz.answers['event_type'];
		if (!eventTypeId || typeof eventTypeId !== 'string') return undefined;
		const eventQuestion = quizConfig.questions.find((q) => q.id === 'event_type');
		const option = eventQuestion?.options?.find((o) => o.id === eventTypeId);
		if (!option) return undefined;
		const eventPrepositionById: Record<string, string> = {
			'event-casamento': 'do casamento',
			'event-viagem': 'da viagem',
			'event-verao': 'do verão',
			'event-aniversario': 'do aniversário',
			'event-reencontro': 'do reencontro'
		};
		const eventPhrase =
			eventPrepositionById[eventTypeId] ??
			`de ${option.text.trim().toLowerCase()}`;
		return `Qual é a data ${eventPhrase}?`;
	});

	// whatsapp: address user by first name
	const whatsappTitle = $derived.by(() => {
		if (question?.id !== 'whatsapp') return undefined;
		const name = quiz.answers['user_name'];
		if (!name || typeof name !== 'string' || !name.trim()) return undefined;
		const firstName = name.trim().split(/\s+/)[0] ?? name.trim();
		return `${firstName}, conecte seu número de WhatsApp à Zuppy.`;
	});

	// gender: subtext with goal (e.g. "Isso muda seu plano de emagrecimento.")
	const genderSubtextOverride = $derived.by(() => {
		if (question?.id !== 'gender') return undefined;
		const goal = quiz.answers['goal_type'];
		const planLabel =
			goal === 'goal-massa'
				? 'ganho de massa'
				: 'emagrecimento';
		return `Homens e mulheres têm metabolismos diferentes. Isso afeta diretamente seu plano de ${planLabel}.`;
	});

	// life_impact: título dinâmico com objetivo + kg (ex.: "quando você emagrecer 10kg?")
	const lifeImpactTitleOverride = $derived.by(() => {
		if (question?.id !== 'life_impact') return undefined;
		const goal = quiz.answers['goal_type'] as string | undefined;
		const current = quiz.answers['weight_current_kg'];
		const goalKg = quiz.answers['weight_goal_kg'];
		const currentNum = typeof current === 'string' ? parseFloat(current) : NaN;
		const goalNum = typeof goalKg === 'string' ? parseFloat(goalKg) : NaN;
		const kg = !isNaN(currentNum) && !isNaN(goalNum) ? Math.round(Math.abs(goalNum - currentNum)) : 0;
		const verbo =
			goal === 'goal-massa'
				? 'ganhar'
				: goal === 'goal-emagrecer'
					? 'emagrecer'
					: 'alcançar seu objetivo';
		if (kg > 0 && (goal === 'goal-emagrecer' || goal === 'goal-massa')) {
			return `O que mais mudaria na sua vida quando você ${verbo} ${kg}kg?`;
		}
		return `O que mais mudaria na sua vida quando você ${verbo}?`;
	});

	// event_type: título dinâmico com objetivo (ex.: "te motivando a emagrecer agora?")
	const eventTypeTitleOverride = $derived.by(() => {
		if (question?.id !== 'event_type') return undefined;
		const goal = quiz.answers['goal_type'] as string | undefined;
		const objetivo =
			goal === 'goal-emagrecer'
				? 'emagrecer'
				: goal === 'goal-massa'
					? 'ganhar massa'
					: 'alcançar seu objetivo';
		return `Tem algum evento especial te motivando a ${objetivo} agora?`;
	});

	// readiness: título dinâmico com peso objetivo (ex.: "chegar em 68kg?")
	const readinessTitleOverride = $derived.by(() => {
		if (question?.id !== 'readiness') return undefined;
		const goalKg = quiz.answers['weight_goal_kg'];
		const goalNum = typeof goalKg === 'string' ? parseFloat(goalKg) : NaN;
		const kg = !isNaN(goalNum) && goalNum > 0 ? Math.round(goalNum) : null;
		const text = kg != null
			? `O quanto você está pronto(a) para fazer pequenos ajustes e chegar em ${kg}kg?`
			: 'O quanto você está pronto(a) para fazer pequenos ajustes e chegar ao seu objetivo?';
		return g(text);
	});

	// Helpers para personalizações dinâmicas
	const _currentKgNum = $derived.by(() => {
		const v = quiz.answers['weight_current_kg'];
		const n = typeof v === 'string' ? parseFloat(v) : NaN;
		return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
	});
	const _goalKgNum = $derived.by(() => {
		const v = quiz.answers['weight_goal_kg'];
		const n = typeof v === 'string' ? parseFloat(v) : NaN;
		return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
	});
	const _goal = $derived(quiz.answers['goal_type'] as string | undefined);
	const _goalLabel = $derived(
		_goal === 'goal-emagrecer' ? 'emagrecer' : _goal === 'goal-massa' ? 'ganhar massa' : null
	);

	// Personalized question: aplica title + subtext overrides sobre gq
	const pq = $derived.by(() => {
		const base = gq ?? question;
		if (!base) return base;
		let text: string = base.text;
		let subtext: string | undefined = base.subtext;
		switch (base.id) {
			case 'weight_goal_kg':
				if (_currentKgNum) {
					subtext = `Você está em ${_currentKgNum}kg. Vamos calcular o que você precisa por dia para chegar ao seu objetivo.`;
				}
				break;
			case 'timeframe':
				if (_currentKgNum && _goalKgNum) {
					subtext = `Para ir de ${_currentKgNum}kg a ${_goalKgNum}kg, vamos definir o ritmo ideal para você.`;
				}
				break;
			case 'focus_areas':
				if (_goal === 'goal-massa') {
					text = 'Qual grupo muscular você mais quer desenvolver?';
					subtext = 'Vamos considerar essa informação no seu plano para acelerar o processo.';
				} else if (_goal === 'goal-emagrecer') {
					text = 'Qual área do seu corpo mais te incomoda hoje?';
					subtext = 'Vamos considerar essa informação no seu plano para acelerar o processo.';
				}
				break;
			case 'activity_level':
				if (_goalLabel) {
					subtext = `Isso define diretamente quantas calorias você pode consumir por dia para ${_goalLabel}.`;
				}
				break;
			case 'water_intake':
				if (_goal === 'goal-emagrecer') {
					subtext = 'A hidratação reduz a fome e acelera o metabolismo. dois aliados diretos para emagrecer.';
				} else if (_goal === 'goal-massa') {
					subtext = 'A hidratação é essencial para a síntese muscular e o seu metabolismo.';
				}
				break;
		}
		if (text === base.text && subtext === base.subtext) return base;
		return { ...base, text: g(text), subtext };
	});

	// All steps use same CTA: "Continuar" with thin arrow on the right
	const buttonLabel = $derived('Continuar');

	function handleSelect(questionId: string, value: string | string[]) {
		if (navigating.from != null || advancing) return;
		quizStore.answer(questionId, value);
		trackQuestionAnswer(questionId, value);
		const state = get(quizStore);
		if (state.quizSessionId) {
			updateAnswers(state.quizSessionId, state.answers, state.scores, questionId, state.visitedQuestions);
		}
		if (isSingleChoiceQuestion) {
			if (!question) return;
			// Calcula próximo com a resposta já aplicada, para não depender de estado reativo no callback
			const newAnswers = { ...quiz.answers, [questionId]: value };
			const visible = computeVisibleQuestions(quizConfig.questions, newAnswers);
			const idx = visible.findIndex((q) => q.id === question.id);
			// Só passar nextId/isLastStep quando a pergunta atual está na lista (idx >= 0); senão usa reativos após tick
			if (idx >= 0) {
				const nextQ = visible[idx + 1] ?? null;
				const isLastStep = idx === visible.length - 1;
				tick().then(() => handleNext(nextQ?.id ?? null, isLastStep));
			} else {
				tick().then(() => handleNext());
			}
		}
	}

	/** Lê o próximo passo a partir do estado atual do store (valor no momento do clique). */
	function getNextStepFromStore(): { nextId: string | null; isLast: boolean } {
		const state = get(quizStore);
		if (!state.currentQuestionId) return { nextId: null, isLast: false };
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const idx = visible.findIndex((q) => q.id === state.currentQuestionId);
		if (idx < 0) return { nextId: null, isLast: false };
		const nextQ = visible[idx + 1] ?? null;
		return { nextId: nextQ?.id ?? null, isLast: idx === visible.length - 1 };
	}

	async function handleNext(nextIdOrUndefined?: string | null, isLastStep?: boolean) {
		if (navigating.from != null || advancing) return;

		const useExplicit = nextIdOrUndefined !== undefined || isLastStep !== undefined;
		const step = useExplicit
			? { nextId: nextIdOrUndefined ?? null, isLast: isLastStep ?? false }
			: getNextStepFromStore();
		const { nextId, isLast: last } = step;

		if (question?.type === 'microresult') {
			const mrTrackMap: Record<string, () => void> = {
				'mr-1': trackMr1Passed,
				'mr-2': trackMr2Passed,
				'mr-3': trackMr3Passed,
				'mr-4': trackMr4Passed,
			};
			mrTrackMap[question.id]?.();
		}

		if (last) {
			advancing = true;
			try {
				quizStore.complete();
				trackQuizComplete();
				await goto('/nome');
			} finally {
				advancing = false;
			}
		} else if (nextId && typeof nextId === 'string') {
			advancing = true;
			try {
				quizStore.goTo(nextId);
				await goto(`/plan/${nextId}`);
			} finally {
				advancing = false;
			}
		}
	}

	/** Pular a pergunta de data (event_date): não salva data e avança. O fluxo ignora a data daqui em diante. */
	function skipEventDateAndNext() {
		if (question?.id !== 'event_date' || advancing || navigating.from != null) return;
		quizStore.answer('event_date', '');
		tick().then(() => handleNext());
	}
</script>

{#if question}
	<!-- Question content — extra padding when Next button is visible; info_medication: alinhado no topo -->
	<div
		class="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full px-4 pt-4 {showNextButton ? 'pb-32' : 'pb-8'} {question.id === 'info_medication'
			? 'justify-start'
			: question.type === 'microresult' || question.type === 'feature_info'
				? 'justify-center'
				: ''}"
	>
		<TransitionWrapper key={question.id}>
			{#if question.type === 'info'}
				<InfoScreen question={pq ?? question} center={question.id === 'info_medication'} />
			{:else if question.type === 'microresult'}
				<MicroResultScreen {question} answers={quiz.answers} onMr4LoadingComplete={() => (mr4LoadingComplete = true)} />
			{:else if question.type === 'feature_info'}
				<FeatureInfoScreen {question} answers={quiz.answers} />
			{:else if question.type === 'number'}
				<QuestionInputNumber
					question={pq ?? question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'date'}
				<div class="flex flex-col gap-4">
					<QuestionInputDate
						question={pq ?? question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						titleOverride={eventDateTitle}
					/>
					{#if question.id === 'event_date'}
						<div class="flex justify-center pt-1">
							<button
								type="button"
								onclick={skipEventDateAndNext}
								disabled={advancing}
								class="text-black text-sm underline disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
							>
								Pular pergunta
							</button>
						</div>
					{/if}
				</div>
			{:else if question.type === 'text'}
				<QuestionInputText
					question={pq ?? question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
					titleOverride={whatsappTitle}
				/>
			{:else if question.type === 'slider'}
				<QuestionSlider
					question={pq ?? question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'ruler'}
				{#if question.id === 'weight_current_kg'}
					<QuestionWeightCurrent
						question={pq ?? question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else if question.id === 'weight_goal_kg'}
					<QuestionWeightGoal
						question={pq ?? question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else}
					<QuestionRuler
						question={pq ?? question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
					/>
				{/if}
			{:else if question.type === 'body_fat_grid'}
				<QuestionBodyFatGrid
					question={pq ?? question}
					genderAnswer={typeof quiz.answers['gender'] === 'string' ? quiz.answers['gender'] : undefined}
					selectedValue={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					beforeStage={bodyFatBeforeStage}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else}
				<QuestionCard
					question={pq ?? question}
					selectedValue={currentAnswer}
					onSelect={handleSelect}
					titleOverride={readinessTitleOverride ?? lifeImpactTitleOverride ?? eventTypeTitleOverride}
					subtextOverride={genderSubtextOverride}
				/>
			{/if}
		</TransitionWrapper>
	</div>

	<!-- Fixed bottom box — hidden for single choice. Botão entra na cascata (delay 300ms entre itens) em microresult. -->
	{#if showNextButton && (question?.id !== 'mr-4' || mr4LoadingComplete)}
		<div class="fixed bottom-0 left-0 right-0">
			<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-8">
			<button
				type="button"
				onclick={() => handleNext()}
				disabled={!canGoNext || navigating.from != null || advancing}
				class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-on-primary transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				in:fade={{ duration: 400, delay: buttonCascadeDelay }}
				out:fade={{ duration: 200 }}
			>
				<span>{buttonLabel}</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</button>
			</div>
		</div>
	{/if}
{/if}
