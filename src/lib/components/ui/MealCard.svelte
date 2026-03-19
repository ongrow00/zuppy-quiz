<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFire } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		name: string;
		kcal: number;
		prot: number;
		carb: number;
		fat: number;
		flipping?: boolean;
		initials?: string;
	}

	let { name, kcal, prot, carb, fat, flipping = false, initials: initialsOverride }: Props = $props();

	const initials = $derived(
		initialsOverride ??
		name
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('')
	);
</script>

<div class="meal-card" style="perspective: 600px;">
	<!-- Avatar -->
	<div class="meal-avatar" aria-hidden="true">
		<span class="flap" class:flipping style="animation-delay: 0ms">{initials}</span>
	</div>

	<!-- Content -->
	<div class="meal-body">
		<span class="meal-name">
			<span class="flap" class:flipping style="animation-delay: 60ms">{name}</span>
		</span>
		<div class="meal-kcal">
			<span class="meal-kcal__fire" aria-hidden="true">
				<FontAwesomeIcon icon={faFire} />
			</span>
			<span class="flap" class:flipping style="animation-delay: 120ms">{kcal}</span>
			<span>kcal</span>
		</div>
		<div class="meal-macros">
			<span class="macro-tag">Prot. <span class="flap" class:flipping style="animation-delay: 180ms">{prot}</span>g</span>
			<span class="macro-tag">Carb <span class="flap" class:flipping style="animation-delay: 230ms">{carb}</span>g</span>
			<span class="macro-tag">Fat <span class="flap" class:flipping style="animation-delay: 280ms">{fat}</span>g</span>
		</div>
	</div>
</div>

<style>
	.meal-card {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #ffffff;
		border-radius: 8px;
		padding: 13px 14px;
		border: 1px solid #e8e8e8;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
		width: 100%;
		text-align: left;
	}

	/* ── Airport flip effect ── */
	.flap {
		display: inline-block;
		transform-origin: center center;
		backface-visibility: hidden;
	}

	.flap.flipping {
		animation: airportFlip 0.52s ease-in-out both;
	}

	@keyframes airportFlip {
		0%   { opacity: 1;   transform: translateY(0px)  rotateX(0deg);   filter: blur(0px);   }
		30%  { opacity: 0;   transform: translateY(-5px) rotateX(-18deg); filter: blur(2px);   }
		55%  { opacity: 0;   transform: translateY(5px)  rotateX(12deg);  filter: blur(2px);   }
		80%  { opacity: 0.8; transform: translateY(-1px) rotateX(-3deg);  filter: blur(0.5px); }
		100% { opacity: 1;   transform: translateY(0px)  rotateX(0deg);   filter: blur(0px);   }
	}

	/* ── Card elements ── */
	.meal-avatar {
		flex-shrink: 0;
		width: 75px;
		height: 75px;
		border-radius: 12px;
		background: #e8f0df;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: 700;
		color: #5a7a35;
		letter-spacing: 0.03em;
	}

	.meal-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meal-name {
		font-size: 14px;
		font-weight: 600;
		color: #0f0f0f;
		line-height: 1.25;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meal-kcal {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: #444;
		font-weight: 400;
		margin-top: 1px;
	}

	.meal-kcal__fire {
		display: inline-flex;
		color: #0a2305;
		flex-shrink: 0;
	}

	.meal-kcal__fire :global(svg) {
		width: 11px;
		height: 11px;
	}

	.meal-macros {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 5px;
		flex-wrap: nowrap;
	}

	.macro-tag {
		font-size: 11.5px;
		color: #333;
		background: #f0f0f0;
		border-radius: 20px;
		padding: 2px 9px;
		font-weight: 500;
		white-space: nowrap;
	}
</style>
