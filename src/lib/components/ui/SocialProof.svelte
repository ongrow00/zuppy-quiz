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
	@property --border-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes border-spin {
		to {
			--border-angle: 360deg;
		}
	}

	.social-proof {
		display: inline-flex;
	}

	.social-proof__wrapper {
		position: relative;
		padding: 2px;
	}

	.social-proof__wrapper--clickable {
		cursor: pointer;
	}

	.social-proof__glow-border {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		pointer-events: none;
	}

	.social-proof__glow-border::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		padding: 2px;
		background: conic-gradient(
			from var(--border-angle),
			transparent 0%,
			transparent 75%,
			rgba(100, 190, 20, 0.3) 82%,
			#6ab820 87%,
			#8ed33a 91%,
			#b6e635 93%,
			#8ed33a 95%,
			#6ab820 97%,
			transparent 100%
		);
		animation: border-spin 9s linear infinite;
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}

	.social-proof__card {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 9999px;
		background: transparent;
		position: relative;
		border: 1px solid var(--color-line, #e8e8e8);
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
		<div class="social-proof__glow-border" aria-hidden="true"></div>
		<div class="social-proof__card">
			<AvatarStack variant="default" />
			<p class="text-xs text-body leading-none text-left">
				<strong class="text-heading font-bold">{count} pessoas</strong> já iniciaram <strong class="text-heading font-bold">seu</strong><br />
				<strong class="text-heading font-bold">plano</strong> nos últimos <strong class="text-heading font-bold">30 minutos</strong>.
			</p>
		</div>
	</div>
</div>
