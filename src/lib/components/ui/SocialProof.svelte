<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	interface Props {
		onClick?: () => void;
	}
	let { onClick }: Props = $props();

	let count = $state(51);

	let timeout: ReturnType<typeof setTimeout>;

	const MAX_COUNT = 87;

	function scheduleNext() {
		if (count >= MAX_COUNT) return;
		const delayMs = 3000 + Math.random() * 2000; // 3 a 5 segundos
		timeout = setTimeout(() => {
			count = Math.min(MAX_COUNT, count + 1);
			scheduleNext();
		}, delayMs);
	}

	onMount(() => {
		count = Math.floor(51 + Math.random() * (75 - 51 + 1)); // 51 a 75
		scheduleNext();
	});

	onDestroy(() => clearTimeout(timeout));

	function handleActivate() {
		onClick?.();
	}
</script>

<style>
	.social-proof {
		display: inline-flex;
	}

	.social-proof__wrapper {
		position: relative;
	}

	.social-proof__wrapper--clickable {
		cursor: pointer;
	}

	.social-proof__card {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 9999px;
		background: transparent;
		position: relative;
	}
</style>

<div class="social-proof">
	<div
		class="social-proof__wrapper {onClick ? 'social-proof__wrapper--clickable' : ''}"
		role={onClick ? 'button' : undefined}
		tabindex={onClick ? 0 : undefined}
		onclick={onClick ? handleActivate : undefined}
		onkeydown={onClick
			? (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleActivate();
					}
				}
			: undefined}
	>
		<div class="social-proof__card">
			<AvatarStack variant="default" />
			<p class="text-xs text-body leading-none text-left">
				<strong class="text-heading font-bold">{count} pessoas</strong> já iniciaram <strong class="text-heading font-bold">seu</strong><br />
				<strong class="text-heading font-bold">plano</strong> nos últimos <strong class="text-heading font-bold">30 minutos</strong>.
			</p>
		</div>
	</div>
</div>
