<script lang="ts">
	interface Props {
		loading?: boolean;
		disabled?: boolean;
		label?: string;
		loadingLabel?: string;
	}

	let {
		loading = false,
		disabled = false,
		label = 'Quero meu plano personalizado',
		loadingLabel = 'Enviando...'
	}: Props = $props();
</script>

<button
	type="submit"
	disabled={disabled || loading}
	class="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-on-primary font-bold text-lg bg-accent transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
>
	{#if loading}
		<svg
			class="animate-spin h-5 w-5"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
		</svg>
		{loadingLabel}
	{:else}
		{label}
	{/if}
</button>
