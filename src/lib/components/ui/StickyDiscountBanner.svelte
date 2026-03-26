<script lang="ts">
	import { getRemaining, formatCountdown } from '$lib/stores/discount-countdown.store';

	let { visible = false, discountCode = '#PHIL545' }: { visible?: boolean; discountCode?: string } = $props();

	const remainingStore = getRemaining();

	function scrollToOffer() {
		document.getElementById('offer-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			scrollToOffer();
		}
	}
</script>

{#if visible}
	<div class="sticky-discount-banner fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
		<div
			class="flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 rounded-b-[15px] bg-[#1a1a1a] py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] text-white cursor-pointer select-none"
			role="button"
			tabindex="0"
			aria-label="Desconto aplicado. Clique para ir à oferta."
			onclick={scrollToOffer}
			onkeydown={onKeydown}
		>
			<div class="flex flex-col gap-0.5">
				<span class="text-[11px] font-medium text-[#9e9e9e]">Desconto aplicado</span>
				<div class="flex flex-wrap items-center gap-1.5">
					<span
						class="inline-flex w-fit items-center rounded-lg bg-[#2a2a2a] px-2.5 py-1 text-sm font-bold tracking-tight uppercase"
					>
						{discountCode}
					</span>
					<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#2d3f1f] text-[#b6e635]">
						50% OFF
					</span>
					<span class="inline-flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600" title="Presente" aria-hidden="true">
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
					</span>
				</div>
			</div>
			<div class="flex flex-col items-end gap-0.5 shrink-0 min-w-[4rem]">
				<span class="text-[11px] font-medium text-[#9e9e9e]">Se encerra em</span>
				<span class="text-xl font-bold tabular-nums text-red-500 min-w-[3.5ch]" aria-live="polite">
					{formatCountdown($remainingStore)}
				</span>
			</div>
		</div>
	</div>
{/if}
