<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * Pilha de avatares sobrepostos: opcionalmente um círculo com iniciais primeiro, depois as fotos em ordem aleatória.
	 */
	const AVATAR_SOURCES = [
		{ src: '/avatars/zuppy_1.webp', alt: '' },
		{ src: '/avatars/zuppy_2.webp', alt: '' },
		{ src: '/avatars/zuppy_3.webp', alt: '' },
		{ src: '/avatars/zuppy_4.webp', alt: '' }
	] as const;

	function shuffleRandom<T>(arr: T[]): T[] {
		const out = [...arr];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	interface Props {
		/** Iniciais exibidas no primeiro círculo (ex: "V" para Você, "MS" para Maria Silva). Sem valor = não mostra círculo de iniciais. */
		initials?: string;
		/** Tamanho dos círculos (padrão w-8 h-8) */
		size?: 'sm' | 'md';
		/** default = tamanho/espaçamento original; large = +20% (usado na página de resultados) */
		variant?: 'default' | 'large';
		/** Limita o número de fotos exibidas */
		max?: number;
	}

	let { initials = undefined, size = 'md', variant = 'large', max = undefined }: Props = $props();

	// Ordem fixa na primeira render (SSR/hidratação); após mount, embaralha uma vez por carregamento
	let avatarsOrder = $state([...AVATAR_SOURCES]);
	onMount(() => {
		avatarsOrder = shuffleRandom([...AVATAR_SOURCES]);
	});
	const shuffledAvatars = $derived(max !== undefined ? avatarsOrder.slice(0, max) : avatarsOrder);

	const sizeClass = $derived.by(() => {
		if (variant === 'default') {
			return size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
		}
		// large: +20% sm 24→28.8px, md 32→38.4px
		return size === 'sm' ? 'w-[28.8px] h-[28.8px] text-[12px]' : 'w-[38.4px] h-[38.4px] text-sm';
	});
	const overlap = $derived.by(() => {
		if (variant === 'default') {
			return size === 'sm' ? '-10px' : '-14px';
		}
		return size === 'sm' ? '-6px' : '-10px';
	});
	const total = $derived(shuffledAvatars.length + (initials ? 1 : 0));
</script>

<div class="flex items-center shrink-0">
	{#if initials}
		<div
			class="rounded-full border border-white/20 overflow-hidden flex-shrink-0 bg-accent/90 flex items-center justify-center font-bold text-on-primary {sizeClass}"
			style="margin-left: 0; z-index: {total};"
			aria-hidden="true"
		>
			{initials.slice(0, 2).toUpperCase()}
		</div>
	{/if}
	{#each shuffledAvatars as avatar, i (avatar.src)}
		<div
			class="rounded-full border border-white/20 overflow-hidden flex-shrink-0 bg-surface {sizeClass}"
			style="margin-left: {i === 0 && !initials ? '0' : overlap}; z-index: {total - 1 - i}"
		>
			<img
				src={avatar.src}
				alt={avatar.alt}
				width="40"
				height="40"
				class="w-full h-full object-cover"
				decoding="async"
			/>
		</div>
	{/each}
</div>
