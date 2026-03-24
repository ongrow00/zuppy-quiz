<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';
	import { initAnalytics } from '$lib/services/analytics.service';
	import { initSupabase } from '$lib/services/supabase';
	import { trackQuizLanded } from '$lib/services/analytics.service';

	declare const fbq: (...args: unknown[]) => void;

	let { children } = $props();

	onMount(() => {
		initAnalytics();
		initSupabase();
	});

	afterNavigate(({ to }) => {
		if (!browser) return;
		fbq('track', 'ViewContent');
		if (to?.url.pathname === '/') {
			trackQuizLanded();
		}
	});

	/** Sincroniza UTMs/offer com a URL em toda navegação (inclui primeira carga com ?utm_*=). */
	$effect(() => {
		if (!browser) return;
		sessionStore.hydrateFromUrl(page.url.searchParams);
	});
</script>

<svelte:head>
	<title>Zuppy</title>
	<meta name="description" content="Zuppy — seu plano personalizado." />
</svelte:head>

<div class="min-h-dvh flex w-full min-w-0 max-w-full flex-col overflow-x-clip">
	{@render children()}
</div>
