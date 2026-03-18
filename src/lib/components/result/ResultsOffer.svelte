<script lang="ts">
	type OfferPlan = {
		id: string;
		label: string;
		oldPrice: number;
		price: number;
		monthly: number;
		badge: string | null;
	};

	let {
		actionVerb,
		planObjectiveLabel,
		plans,
		selectedPlan = $bindable(''),
		class: className = '',
		name = 'Você',
		sexo = '',
		age = '',
		objetivo = ''
	}: {
		actionVerb: string;
		planObjectiveLabel: string;
		plans: OfferPlan[];
		selectedPlan?: string;
		class?: string;
		name?: string;
		sexo?: string;
		age?: string;
		objetivo?: string;
	} = $props();
</script>

<div class="offer {className}">
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
								<span class="line-through text-muted">R${plan.oldPrice}</span>
								<span class="text-muted ml-1">R${plan.price}</span>
								<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-nutrition-green)]/20 text-[var(--color-nutrition-green-dark)]">30% OFF</span>
								<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600" title="Presente">
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
								</span>
							</p>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-2xl font-extrabold text-heading leading-none">R${plan.monthly}</p>
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
		<i class="fa-brands fa-whatsapp text-green-500" aria-hidden="true"></i>
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
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 35%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 65%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: offer-cta-shimmer 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes offer-cta-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
