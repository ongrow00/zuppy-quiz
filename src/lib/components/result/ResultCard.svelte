<script lang="ts">
	import type { ResultProfile } from '$lib/data/types';
	import ProfileBadge from './ProfileBadge.svelte';

	interface Props {
		profile: ResultProfile;
		class?: string;
	}

	let { profile, class: className = '' }: Props = $props();
</script>

<div class="flex flex-col items-center text-center gap-6 {className}">
	{#if profile.imageUrl}
		<img
			src={profile.imageUrl}
			alt={profile.name}
			class="w-40 h-40 rounded-full object-cover shadow-lg"
			fetchpriority="high"
			loading="eager"
		/>
	{:else}
		<div
			class="w-40 h-40 rounded-full flex items-center justify-center text-4xl font-bold text-heading"
			style="background-color: {profile.accentColor}20; color: {profile.accentColor};"
		>
			{profile.name.charAt(0)}
		</div>
	{/if}

	<ProfileBadge {profile} />

	<div class="space-y-2">
		<h1 class="text-2xl font-bold text-heading">{profile.name}</h1>
		<p class="text-lg text-body font-medium italic">"{profile.tagline}"</p>
	</div>

	<p class="text-base text-body leading-relaxed max-w-md">{profile.description}</p>

	{#if profile.cta.url}
		<a
			href={profile.cta.url}
			class="inline-flex items-center justify-center w-full max-w-sm px-6 py-4 text-on-primary font-semibold rounded-2xl transition-all duration-200 active:scale-95"
			style="background-color: {profile.accentColor};"
		>
			{profile.cta.text}
		</a>
	{:else}
		<p class="text-sm text-muted font-medium">{profile.cta.text}</p>
	{/if}
</div>
