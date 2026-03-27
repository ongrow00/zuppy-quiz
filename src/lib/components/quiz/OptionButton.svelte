<script lang="ts">
	import type { QuizOption } from '$lib/data/types';

	interface Props {
		option: QuizOption;
		selected: boolean;
		type?: 'single' | 'multiple';
		disabled?: boolean;
		/** No card/tábua: simple list style */
		minimal?: boolean;
		/** Horizontal row item (e.g. 1-5 scale), use flex-1 */
		horizontal?: boolean;
		/** Checkbox on top, text below (e.g. grid de dias) */
		stacked?: boolean;
		/** Classes extras na imagem do layout horizontal (ex.: object-contain para ilustrações) */
		horizontalImageClass?: string;
		/** Classes extras no título (layout imagem em cima, ex.: text-xl quando o pai usa zoom) */
		optionTitleClass?: string;
		onclick: (optionId: string) => void;
	}

	let {
		option,
		selected,
		type = 'single',
		disabled = false,
		minimal = false,
		horizontal = false,
		stacked = false,
		horizontalImageClass,
		optionTitleClass,
		onclick
	}: Props = $props();

	// Single = radio (circle only). Multiple = checkbox (square with check).
	const isCheckbox = $derived(type === 'multiple');

	// Title + description: use option.description or split on " — " or " - "
	const splitPoint = $derived(option.text.includes(' — ') ? ' — ' : option.text.includes(' - ') ? ' - ' : null);
	const title = $derived(
		option.description ? option.text : splitPoint ? option.text.split(splitPoint)[0]?.trim() ?? option.text : option.text
	);
	const description = $derived(
		option.description ?? (splitPoint ? option.text.split(splitPoint).slice(1).join(splitPoint).trim() : '')
	);
	const hasDescription = $derived(description.length > 0);
	/** Imagem acima do texto, 100% da largura (ex.: gênero em horizontal) */
	const imageOnTop = $derived(horizontal && !!option.imageUrl);
</script>

<button
	type="button"
	role={isCheckbox ? 'checkbox' : 'radio'}
	aria-checked={selected}
	aria-disabled={disabled}
	disabled={disabled}
	onclick={() => !disabled && onclick(option.id)}
	class="text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
		{horizontal ? 'flex-1 min-w-0 flex flex-col overflow-hidden py-0 rounded-xl' : 'w-full px-5 py-4 rounded-2xl'}
		{horizontal && !imageOnTop ? 'items-center justify-center py-4' : ''}
		{minimal ? 'border-0 rounded-xl bg-surface-2/50 py-3' : 'border-2'}
		{selected
		? minimal ? 'bg-accent text-on-primary' : 'border-accent bg-accent text-on-primary'
		: minimal ? 'bg-surface-2/50 text-body hover:bg-surface-2' : 'border-line bg-surface text-body hover:border-accent/50 hover:bg-surface-2'}
		{disabled ? ' opacity-50 pointer-events-none' : ''}"
>
	{#if imageOnTop}
		<!-- Imagem 100% da largura, altura proporcional -->
		<img
			src={option.imageUrl}
			alt=""
			class="w-full h-auto shrink-0 {horizontalImageClass ?? 'object-cover'}"
			loading="lazy"
		/>
		<div class="flex items-center justify-center gap-3 px-3 py-3 min-h-[48px] min-w-0 overflow-hidden">
			<span class="font-medium leading-snug text-center break-words {optionTitleClass ?? ''}">{title}</span>
		</div>
	{:else if stacked && isCheckbox}
		<div class="flex flex-col items-center justify-center gap-2">
			<span
				class="shrink-0 flex items-center justify-center w-5 h-5 border-2 rounded-md transition-colors
					{selected ? 'border-bg' : 'border-line'}"
			>
				{#if selected}
					<svg class="w-3 h-3 text-on-primary" viewBox="0 0 12 12" fill="none">
						<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				{/if}
			</span>
			<span class="font-medium leading-snug text-center text-sm break-words">{title}</span>
		</div>
	{:else}
		<div class="flex items-center gap-3">
			{#if isCheckbox}
				<span
					class="shrink-0 flex items-center justify-center w-5 h-5 border-2 rounded-md transition-colors
						{selected ? 'border-bg' : 'border-line'}"
				>
					{#if selected}
						<svg class="w-3 h-3 text-on-primary" viewBox="0 0 12 12" fill="none">
							<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{/if}
				</span>
			{/if}
			<div class="flex flex-col gap-0.5 min-w-0 overflow-hidden">
				<span class="font-medium leading-snug break-words">{title}</span>
				{#if hasDescription}
					<span class="text-sm opacity-90 leading-snug break-words {selected ? 'text-on-primary/90' : 'text-muted'}">{description}</span>
				{/if}
			</div>
		</div>
		{#if option.imageUrl}
			<img src={option.imageUrl} alt="" class="mt-3 rounded-xl w-full object-cover max-h-32" loading="lazy" />
		{/if}
	{/if}
</button>
