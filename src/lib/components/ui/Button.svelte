<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:pointer-events-none active:scale-95';

	const variants: Record<Variant, string> = {
		primary:
			'bg-accent text-on-primary hover:bg-accent-dark focus-visible:ring-accent',
		secondary:
			'bg-surface-2 text-heading border border-line hover:bg-line focus-visible:ring-line',
		ghost:
			'text-body hover:bg-surface-2 hover:text-heading focus-visible:ring-line'
	};

	const sizes: Record<Size, string> = {
		sm: 'text-sm px-4 py-2 gap-1.5',
		md: 'text-base px-6 py-3 gap-2',
		lg: 'text-lg px-8 py-4 gap-2'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class="{base} {variants[variant]} {sizes[size]} {className}"
>
	{#if loading}
		<svg
			class="animate-spin -ml-1 mr-2 h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			></path>
		</svg>
	{/if}
	{@render children?.()}
</button>
