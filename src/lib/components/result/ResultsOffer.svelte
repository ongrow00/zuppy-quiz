<script lang="ts">
	import { get } from 'svelte/store';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
	import type { OfferPlan } from '$lib/data/offer-plans';
	import { sessionStore } from '$lib/stores/session.store';
	import { appendHotmartBuyerParams } from '$lib/utils/hotmart-checkout';

	let {
		actionVerb,
		planObjectiveLabel,
		plans,
		selectedPlan = $bindable(''),
		class: className = '',
		/** Só o primeiro bloco na página deve ter id (âncara scroll / banner). */
		offerSectionId = 'offer-section',
		name = 'Você',
		/** Nome completo para pré-preencher o checkout Hotmart (sem fallback “Você”). */
		checkoutFullName = '',
		checkoutWhatsapp = '',
		sexo = '',
		age = '',
		objetivo = ''
	}: {
		actionVerb: string;
		planObjectiveLabel: string;
		plans: OfferPlan[];
		selectedPlan?: string;
		class?: string;
		offerSectionId?: string | null;
		name?: string;
		checkoutFullName?: string;
		checkoutWhatsapp?: string;
		sexo?: string;
		age?: string;
		objetivo?: string;
	} = $props();

	const selectedCheckoutUrl = $derived.by(() => {
		const p = plans.find((x) => x.id === selectedPlan);
		return p?.checkoutUrl ?? '';
	});

	function goToCheckout() {
		if (!selectedCheckoutUrl) return;
		const session = get(sessionStore);
		const hasUtm = Object.values(session.utm).some((v) => Boolean(v && String(v).trim()));
		const srcExtras =
			session.offer != null && String(session.offer).trim() !== ''
				? { of: String(session.offer).trim() }
				: undefined;
		const tracking =
			hasUtm || srcExtras
				? { utm: session.utm, ...(srcExtras ? { srcExtras } : {}) }
				: undefined;

		const url = appendHotmartBuyerParams(
			selectedCheckoutUrl,
			{
				fullName: checkoutFullName,
				whatsapp: checkoutWhatsapp
			},
			tracking
		);
		window.location.assign(url);
	}
</script>

<div id={offerSectionId ?? undefined} class="offer {className}">
	<!-- CTA header -->
	<div class="mt-8 text-center">
		<h2 class="text-2xl font-extrabold text-heading leading-none mb-3">
			Conecte seu WhatsApp ao <span class="text-nutrition-green">Zuppy</span> e acesse seu plano completo agora.
		</h2>
		<p class="text-sm text-muted leading-none">
			<span class="text-nutrition-green font-bold">{name}</span>, criamos o plano de calorias perfeito para você, que é <span class="text-nutrition-green font-bold">{sexo || '—'}</span> e tem <span class="text-nutrition-green font-bold">{age || '—'}</span> anos e quer <span class="text-nutrition-green font-bold">{objetivo || actionVerb}</span>. Conecte o Zuppy ao seu WhatsApp e deixe ele fazer o trabalho.
		</p>
	</div>

	<!-- Seletor de planos -->
	<div class="mt-6">
		<p class="text-xs text-muted text-center mb-3">Clique para escolher seu plano</p>

		<div class="flex flex-col gap-3">
			{#each plans as plan}
				<button
					type="button"
					onclick={() => (selectedPlan = plan.id)}
					class="w-full text-left rounded-2xl overflow-hidden bg-surface transition-all duration-200 transition-opacity"
					class:opacity-60={!!selectedPlan && selectedPlan !== plan.id}
					class:ring-2={selectedPlan === plan.id}
					class:ring-heading={selectedPlan === plan.id}
				>
					{#if plan.badge}
						<div
							class="px-4 py-1.5 text-center transition-colors bg-heading"
						>
							<span
								class="text-xs font-medium transition-colors text-on-primary"
							>{plan.badge}</span>
						</div>
					{/if}
					<div class="flex items-center gap-3 px-4 py-4 min-h-[90px]">
						<div
							class="w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors {selectedPlan === plan.id
								? 'border-heading'
								: 'border-[#C7C7CC]'}"
						>
							{#if selectedPlan === plan.id}
								<div class="w-3 h-3 rounded-full bg-heading"></div>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<p
								class="text-sm font-semibold leading-none mb-1 transition-colors"
								class:text-heading={selectedPlan === plan.id}
							>{plan.label}</p>
							<p class="text-xs leading-none flex flex-wrap items-center gap-1.5">
								<span class="line-through text-muted tabular-nums">R$ {plan.oldPrice}</span>
								<span class="font-semibold text-heading tabular-nums ml-0.5">R$ {plan.price}</span>
								<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-nutrition-green)]/20 text-[var(--color-nutrition-green-dark)]">{plan.discountPercent}% OFF</span>
								<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600" title="Presente">
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
								</span>
							</p>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-2xl font-extrabold text-heading leading-none tabular-nums">R$ {plan.monthly}</p>
							<p class="text-[10px] text-muted">por mês</p>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<button
		type="button"
		disabled={!selectedPlan}
		onclick={goToCheckout}
		class="mt-4 w-full h-[60px] flex items-center justify-center rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
		class:bg-[#E8E8ED]={!selectedPlan}
		class:text-[#8e8e93]={!selectedPlan}
		class:cta-shimmer={!!selectedPlan}
		class:relative={!!selectedPlan}
		class:overflow-hidden={!!selectedPlan}
		class:bg-accent={!!selectedPlan}
		class:text-on-primary={!!selectedPlan}
		class:active:scale-[0.98]={!!selectedPlan}
		class:hover:bg-accent-dark={!!selectedPlan}
		class:focus-visible:outline-none={!!selectedPlan}
		class:focus-visible:ring-2={!!selectedPlan}
		class:focus-visible:ring-accent={!!selectedPlan}
		class:focus-visible:ring-offset-2={!!selectedPlan}
		class:focus-visible:ring-offset-bg={!!selectedPlan}
	>
		<span class="relative z-10">Ativar Meu Plano Agora</span>
	</button>

	<p class="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
		<span class="offer-fa-wa inline-flex shrink-0 items-center justify-center text-green-500" aria-hidden="true">
			<FontAwesomeIcon icon={faWhatsapp} />
		</span>
		Acesso imediato no WhatsApp
	</p>

	<div class="mt-4 flex justify-center overflow-hidden">
		<img src="/assets/pagamentos.png" alt="Métodos de pagamento aceitos" class="h-7 max-w-full object-contain" />
	</div>

	<div class="mt-5 flex items-center gap-4 pb-8">
		<img src="/assets/garantia-7dias.png" alt="Garantia de 7 dias" class="w-20 h-20 shrink-0 object-contain" />
		<p class="text-xs text-muted leading-[12px]">
			Se nos primeiros 7 dias você sentir que o Zuppy não é pra você, é só clicar em um botão na plataforma e devolvemos 100% do seu dinheiro. Sem perguntas.
		</p>
	</div>
</div>

<style>
	.cta-shimmer::after {
		content: '';
		position: absolute;
		top: 0;
		left: -55%;
		width: 55%;
		height: 100%;
		background: linear-gradient(
			105deg,
			transparent 0%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 100%
		);
		animation: offer-cta-shimmer-x 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes offer-cta-shimmer-x {
		0% {
			transform: translateX(-10%);
		}
		100% {
			transform: translateX(320%);
		}
	}

	.offer-fa-wa {
		width: 0.875rem;
		height: 0.875rem;
	}

	.offer-fa-wa :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
