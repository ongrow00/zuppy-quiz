<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';

	let { children } = $props();

	onMount(() => {
		sessionStore.hydrateFromUrl(new URLSearchParams(window.location.search));
	});
</script>

<svelte:head>
	<title>Zuppy</title>
	<meta name="description" content="Zuppy — seu plano personalizado." />
</svelte:head>

<div class="h-full min-h-0 flex flex-col">
	{@render children()}
</div>
