<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="glow-frame relative p-0.5 rounded-xl {className}">
	<div class="glow-frame__ring absolute inset-0 rounded-xl pointer-events-none" aria-hidden="true"></div>
	<div class="glow-frame__inner relative rounded-xl border-0 bg-transparent p-1">
		{@render children?.()}
	</div>
</div>

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

	.glow-frame__ring::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 0.75rem;
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
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}
</style>
