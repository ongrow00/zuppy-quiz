<script lang="ts">
	interface Props {
		direction: 'left' | 'right';
		class?: string;
	}

	let { direction, class: className = '' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="14"
	height="14"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="shrink-0 text-nutrition-green-dark {className}"
	aria-hidden="true"
>
	{#if direction === 'right'}
		<line x1="4" y1="12" x2="20" y2="12" />
		<polyline points="14 8 20 12 14 16" />
	{:else}
		<line x1="20" y1="12" x2="4" y2="12" />
		<polyline points="10 8 4 12 10 16" />
	{/if}
</svg>
