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
	<div class="sticky-discount-banner fixed inset-x-0 top-0 z-50 px-4 pt-[env(safe-area-inset-top)]">
		<div
			class="mx-auto flex w-full max-w-lg items-center justify-between gap-4 rounded-b-[15px] bg-[#1a1a1a] px-4 py-3 text-white cursor-pointer select-none"
			role="button"
			tabindex="0"
			aria-label="Desconto aplicado. Clique para ir à oferta."
			onclick={scrollToOffer}
			onkeydown={onKeydown}
		>
			<div class="flex flex-col gap-0.5">
				<span class="text-[11px] font-medium text-[#9e9e9e]">Desconto aplicado</span>
				<span
					class="inline-flex w-fit items-center rounded-lg bg-[#2a2a2a] px-2.5 py-1 text-sm font-bold tracking-tight uppercase"
				>
					{discountCode}
				</span>
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
