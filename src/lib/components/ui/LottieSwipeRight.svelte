<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import lottie from 'lottie-web';
	import animationData from '$lib/assets/lottie/swipe-right.json';

	let container = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!browser || !container) return;
		const anim = lottie.loadAnimation({
			container,
			renderer: 'svg',
			loop: true,
			autoplay: true,
			animationData
		});
		return () => {
			anim.destroy();
		};
	});
</script>

<div
	bind:this={container}
	class="mx-auto h-[50px] w-[50px] shrink-0 overflow-hidden"
	aria-hidden="true"
/>
