<script lang="ts">
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { quizStore } from '$lib/stores/quiz.store';

	const COUNTRIES = [
		{ dial: '55',  flag: '🇧🇷', name: 'Brasil' },
		{ dial: '1',   flag: '🇺🇸', name: 'Estados Unidos' },
		{ dial: '351', flag: '🇵🇹', name: 'Portugal' },
		{ dial: '54',  flag: '🇦🇷', name: 'Argentina' },
		{ dial: '244', flag: '🇦🇴', name: 'Angola' },
		{ dial: '258', flag: '🇲🇿', name: 'Moçambique' },
		{ dial: '238', flag: '🇨🇻', name: 'Cabo Verde' },
		{ dial: '239', flag: '🇸🇹', name: 'São Tomé e Príncipe' },
		{ dial: '245', flag: '🇬🇼', name: 'Guiné-Bissau' },
		{ dial: '853', flag: '🇲🇴', name: 'Macau' },
		{ dial: '93',  flag: '🇦🇫', name: 'Afeganistão' },
		{ dial: '355', flag: '🇦🇱', name: 'Albânia' },
		{ dial: '213', flag: '🇩🇿', name: 'Argélia' },
		{ dial: '376', flag: '🇦🇩', name: 'Andorra' },
		{ dial: '1268',flag: '🇦🇬', name: 'Antígua e Barbuda' },
		{ dial: '374', flag: '🇦🇲', name: 'Armênia' },
		{ dial: '61',  flag: '🇦🇺', name: 'Austrália' },
		{ dial: '43',  flag: '🇦🇹', name: 'Áustria' },
		{ dial: '994', flag: '🇦🇿', name: 'Azerbaijão' },
		{ dial: '1242',flag: '🇧🇸', name: 'Bahamas' },
		{ dial: '973', flag: '🇧🇭', name: 'Barém' },
		{ dial: '880', flag: '🇧🇩', name: 'Bangladesh' },
		{ dial: '1246',flag: '🇧🇧', name: 'Barbados' },
		{ dial: '375', flag: '🇧🇾', name: 'Bielorrússia' },
		{ dial: '32',  flag: '🇧🇪', name: 'Bélgica' },
		{ dial: '501', flag: '🇧🇿', name: 'Belize' },
		{ dial: '229', flag: '🇧🇯', name: 'Benin' },
		{ dial: '975', flag: '🇧🇹', name: 'Butão' },
		{ dial: '591', flag: '🇧🇴', name: 'Bolívia' },
		{ dial: '387', flag: '🇧🇦', name: 'Bósnia e Herzegovina' },
		{ dial: '267', flag: '🇧🇼', name: 'Botsuana' },
		{ dial: '673', flag: '🇧🇳', name: 'Brunei' },
		{ dial: '359', flag: '🇧🇬', name: 'Bulgária' },
		{ dial: '226', flag: '🇧🇫', name: 'Burkina Faso' },
		{ dial: '257', flag: '🇧🇮', name: 'Burundi' },
		{ dial: '855', flag: '🇰🇭', name: 'Camboja' },
		{ dial: '237', flag: '🇨🇲', name: 'Camarões' },
		{ dial: '1',   flag: '🇨🇦', name: 'Canadá' },
		{ dial: '236', flag: '🇨🇫', name: 'República Centro-Africana' },
		{ dial: '235', flag: '🇹🇩', name: 'Chade' },
		{ dial: '56',  flag: '🇨🇱', name: 'Chile' },
		{ dial: '86',  flag: '🇨🇳', name: 'China' },
		{ dial: '57',  flag: '🇨🇴', name: 'Colômbia' },
		{ dial: '269', flag: '🇰🇲', name: 'Comores' },
		{ dial: '242', flag: '🇨🇬', name: 'Congo' },
		{ dial: '243', flag: '🇨🇩', name: 'Congo (RDC)' },
		{ dial: '506', flag: '🇨🇷', name: 'Costa Rica' },
		{ dial: '225', flag: '🇨🇮', name: 'Costa do Marfim' },
		{ dial: '385', flag: '🇭🇷', name: 'Croácia' },
		{ dial: '53',  flag: '🇨🇺', name: 'Cuba' },
		{ dial: '357', flag: '🇨🇾', name: 'Chipre' },
		{ dial: '420', flag: '🇨🇿', name: 'Chéquia' },
		{ dial: '45',  flag: '🇩🇰', name: 'Dinamarca' },
		{ dial: '253', flag: '🇩🇯', name: 'Djibuti' },
		{ dial: '1767',flag: '🇩🇲', name: 'Dominica' },
		{ dial: '1809',flag: '🇩🇴', name: 'República Dominicana' },
		{ dial: '593', flag: '🇪🇨', name: 'Equador' },
		{ dial: '20',  flag: '🇪🇬', name: 'Egito' },
		{ dial: '503', flag: '🇸🇻', name: 'El Salvador' },
		{ dial: '240', flag: '🇬🇶', name: 'Guiné Equatorial' },
		{ dial: '291', flag: '🇪🇷', name: 'Eritreia' },
		{ dial: '372', flag: '🇪🇪', name: 'Estônia' },
		{ dial: '268', flag: '🇸🇿', name: 'Essuatíni' },
		{ dial: '251', flag: '🇪🇹', name: 'Etiópia' },
		{ dial: '679', flag: '🇫🇯', name: 'Fiji' },
		{ dial: '358', flag: '🇫🇮', name: 'Finlândia' },
		{ dial: '33',  flag: '🇫🇷', name: 'França' },
		{ dial: '241', flag: '🇬🇦', name: 'Gabão' },
		{ dial: '220', flag: '🇬🇲', name: 'Gâmbia' },
		{ dial: '995', flag: '🇬🇪', name: 'Geórgia' },
		{ dial: '49',  flag: '🇩🇪', name: 'Alemanha' },
		{ dial: '233', flag: '🇬🇭', name: 'Gana' },
		{ dial: '30',  flag: '🇬🇷', name: 'Grécia' },
		{ dial: '1473',flag: '🇬🇩', name: 'Granada' },
		{ dial: '502', flag: '🇬🇹', name: 'Guatemala' },
		{ dial: '224', flag: '🇬🇳', name: 'Guiné' },
		{ dial: '592', flag: '🇬🇾', name: 'Guiana' },
		{ dial: '509', flag: '🇭🇹', name: 'Haiti' },
		{ dial: '504', flag: '🇭🇳', name: 'Honduras' },
		{ dial: '36',  flag: '🇭🇺', name: 'Hungria' },
		{ dial: '354', flag: '🇮🇸', name: 'Islândia' },
		{ dial: '91',  flag: '🇮🇳', name: 'Índia' },
		{ dial: '62',  flag: '🇮🇩', name: 'Indonésia' },
		{ dial: '98',  flag: '🇮🇷', name: 'Irã' },
		{ dial: '964', flag: '🇮🇶', name: 'Iraque' },
		{ dial: '353', flag: '🇮🇪', name: 'Irlanda' },
		{ dial: '972', flag: '🇮🇱', name: 'Israel' },
		{ dial: '39',  flag: '🇮🇹', name: 'Itália' },
		{ dial: '1876',flag: '🇯🇲', name: 'Jamaica' },
		{ dial: '81',  flag: '🇯🇵', name: 'Japão' },
		{ dial: '962', flag: '🇯🇴', name: 'Jordânia' },
		{ dial: '7',   flag: '🇰🇿', name: 'Cazaquistão' },
		{ dial: '254', flag: '🇰🇪', name: 'Quênia' },
		{ dial: '686', flag: '🇰🇮', name: 'Kiribati' },
		{ dial: '850', flag: '🇰🇵', name: 'Coreia do Norte' },
		{ dial: '82',  flag: '🇰🇷', name: 'Coreia do Sul' },
		{ dial: '965', flag: '🇰🇼', name: 'Kuwait' },
		{ dial: '996', flag: '🇰🇬', name: 'Quirguistão' },
		{ dial: '856', flag: '🇱🇦', name: 'Laos' },
		{ dial: '371', flag: '🇱🇻', name: 'Letônia' },
		{ dial: '961', flag: '🇱🇧', name: 'Líbano' },
		{ dial: '266', flag: '🇱🇸', name: 'Lesoto' },
		{ dial: '231', flag: '🇱🇷', name: 'Libéria' },
		{ dial: '218', flag: '🇱🇾', name: 'Líbia' },
		{ dial: '423', flag: '🇱🇮', name: 'Liechtenstein' },
		{ dial: '370', flag: '🇱🇹', name: 'Lituânia' },
		{ dial: '352', flag: '🇱🇺', name: 'Luxemburgo' },
		{ dial: '261', flag: '🇲🇬', name: 'Madagascar' },
		{ dial: '265', flag: '🇲🇼', name: 'Malawi' },
		{ dial: '60',  flag: '🇲🇾', name: 'Malásia' },
		{ dial: '960', flag: '🇲🇻', name: 'Maldivas' },
		{ dial: '223', flag: '🇲🇱', name: 'Mali' },
		{ dial: '356', flag: '🇲🇹', name: 'Malta' },
		{ dial: '692', flag: '🇲🇭', name: 'Ilhas Marshall' },
		{ dial: '222', flag: '🇲🇷', name: 'Mauritânia' },
		{ dial: '230', flag: '🇲🇺', name: 'Maurícia' },
		{ dial: '52',  flag: '🇲🇽', name: 'México' },
		{ dial: '691', flag: '🇫🇲', name: 'Micronésia' },
		{ dial: '373', flag: '🇲🇩', name: 'Moldávia' },
		{ dial: '377', flag: '🇲🇨', name: 'Mônaco' },
		{ dial: '976', flag: '🇲🇳', name: 'Mongólia' },
		{ dial: '382', flag: '🇲🇪', name: 'Montenegro' },
		{ dial: '212', flag: '🇲🇦', name: 'Marrocos' },
		{ dial: '95',  flag: '🇲🇲', name: 'Myanmar' },
		{ dial: '264', flag: '🇳🇦', name: 'Namíbia' },
		{ dial: '674', flag: '🇳🇷', name: 'Nauru' },
		{ dial: '977', flag: '🇳🇵', name: 'Nepal' },
		{ dial: '31',  flag: '🇳🇱', name: 'Países Baixos' },
		{ dial: '64',  flag: '🇳🇿', name: 'Nova Zelândia' },
		{ dial: '505', flag: '🇳🇮', name: 'Nicarágua' },
		{ dial: '227', flag: '🇳🇪', name: 'Níger' },
		{ dial: '234', flag: '🇳🇬', name: 'Nigéria' },
		{ dial: '389', flag: '🇲🇰', name: 'Macedônia do Norte' },
		{ dial: '47',  flag: '🇳🇴', name: 'Noruega' },
		{ dial: '968', flag: '🇴🇲', name: 'Omã' },
		{ dial: '92',  flag: '🇵🇰', name: 'Paquistão' },
		{ dial: '680', flag: '🇵🇼', name: 'Palau' },
		{ dial: '970', flag: '🇵🇸', name: 'Palestina' },
		{ dial: '507', flag: '🇵🇦', name: 'Panamá' },
		{ dial: '675', flag: '🇵🇬', name: 'Papua Nova Guiné' },
		{ dial: '595', flag: '🇵🇾', name: 'Paraguai' },
		{ dial: '51',  flag: '🇵🇪', name: 'Peru' },
		{ dial: '63',  flag: '🇵🇭', name: 'Filipinas' },
		{ dial: '48',  flag: '🇵🇱', name: 'Polônia' },
		{ dial: '974', flag: '🇶🇦', name: 'Qatar' },
		{ dial: '40',  flag: '🇷🇴', name: 'Romênia' },
		{ dial: '7',   flag: '🇷🇺', name: 'Rússia' },
		{ dial: '250', flag: '🇷🇼', name: 'Ruanda' },
		{ dial: '1869',flag: '🇰🇳', name: 'São Cristóvão e Névis' },
		{ dial: '1758',flag: '🇱🇨', name: 'Santa Lúcia' },
		{ dial: '1784',flag: '🇻🇨', name: 'São Vicente e Granadinas' },
		{ dial: '685', flag: '🇼🇸', name: 'Samoa' },
		{ dial: '378', flag: '🇸🇲', name: 'San Marino' },
		{ dial: '966', flag: '🇸🇦', name: 'Arábia Saudita' },
		{ dial: '221', flag: '🇸🇳', name: 'Senegal' },
		{ dial: '381', flag: '🇷🇸', name: 'Sérvia' },
		{ dial: '248', flag: '🇸🇨', name: 'Seicheles' },
		{ dial: '232', flag: '🇸🇱', name: 'Serra Leoa' },
		{ dial: '65',  flag: '🇸🇬', name: 'Singapura' },
		{ dial: '421', flag: '🇸🇰', name: 'Eslováquia' },
		{ dial: '386', flag: '🇸🇮', name: 'Eslovênia' },
		{ dial: '677', flag: '🇸🇧', name: 'Ilhas Salomão' },
		{ dial: '252', flag: '🇸🇴', name: 'Somália' },
		{ dial: '27',  flag: '🇿🇦', name: 'África do Sul' },
		{ dial: '211', flag: '🇸🇸', name: 'Sudão do Sul' },
		{ dial: '34',  flag: '🇪🇸', name: 'Espanha' },
		{ dial: '94',  flag: '🇱🇰', name: 'Sri Lanka' },
		{ dial: '249', flag: '🇸🇩', name: 'Sudão' },
		{ dial: '597', flag: '🇸🇷', name: 'Suriname' },
		{ dial: '46',  flag: '🇸🇪', name: 'Suécia' },
		{ dial: '41',  flag: '🇨🇭', name: 'Suíça' },
		{ dial: '963', flag: '🇸🇾', name: 'Síria' },
		{ dial: '886', flag: '🇹🇼', name: 'Taiwan' },
		{ dial: '992', flag: '🇹🇯', name: 'Tajiquistão' },
		{ dial: '255', flag: '🇹🇿', name: 'Tanzânia' },
		{ dial: '66',  flag: '🇹🇭', name: 'Tailândia' },
		{ dial: '670', flag: '🇹🇱', name: 'Timor-Leste' },
		{ dial: '228', flag: '🇹🇬', name: 'Togo' },
		{ dial: '676', flag: '🇹🇴', name: 'Tonga' },
		{ dial: '1868',flag: '🇹🇹', name: 'Trinidad e Tobago' },
		{ dial: '216', flag: '🇹🇳', name: 'Tunísia' },
		{ dial: '90',  flag: '🇹🇷', name: 'Turquia' },
		{ dial: '993', flag: '🇹🇲', name: 'Turcomenistão' },
		{ dial: '688', flag: '🇹🇻', name: 'Tuvalu' },
		{ dial: '256', flag: '🇺🇬', name: 'Uganda' },
		{ dial: '380', flag: '🇺🇦', name: 'Ucrânia' },
		{ dial: '971', flag: '🇦🇪', name: 'Emirados Árabes Unidos' },
		{ dial: '44',  flag: '🇬🇧', name: 'Reino Unido' },
		{ dial: '598', flag: '🇺🇾', name: 'Uruguai' },
		{ dial: '998', flag: '🇺🇿', name: 'Uzbequistão' },
		{ dial: '678', flag: '🇻🇺', name: 'Vanuatu' },
		{ dial: '58',  flag: '🇻🇪', name: 'Venezuela' },
		{ dial: '84',  flag: '🇻🇳', name: 'Vietnã' },
		{ dial: '967', flag: '🇾🇪', name: 'Iêmen' },
		{ dial: '260', flag: '🇿🇲', name: 'Zâmbia' },
		{ dial: '263', flag: '🇿🇼', name: 'Zimbábue' },
	];

	const name = $derived($postQuizStore.name);
	const whatsapp = $derived($postQuizStore.whatsapp);

	const whatsappTitle = $derived(
		name.trim() ? `${name.trim()}, qual é o seu WhatsApp?` : 'Qual é o seu WhatsApp?'
	);

	const objetivoLabel = $derived.by(() => {
		const goalId = $quizStore.answers['goal_type'] as string | undefined;
		return goalId === 'goal-emagrecer'
			? 'emagrecer'
			: goalId === 'goal-massa'
				? 'ganhar massa'
				: 'seu objetivo';
	});

	// Country selector state
	let selectedDial = $state('55');
	let dropdownOpen = $state(false);
	let searchQuery = $state('');
	let dropdownEl = $state<HTMLDivElement | null>(null);

	const selectedCountry = $derived(COUNTRIES.find(c => c.dial === selectedDial && c.name === 'Brasil') ?? COUNTRIES.find(c => c.dial === selectedDial) ?? COUNTRIES[0]);

	const filteredCountries = $derived(
		searchQuery.trim()
			? COUNTRIES.filter(c =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.dial.includes(searchQuery.replace('+', ''))
			)
			: COUNTRIES
	);

	function selectCountry(dial: string) {
		selectedDial = dial;
		dropdownOpen = false;
		searchQuery = '';
		// Re-save number with new country code
		const digits = (whatsapp || '').replace(/\D/g, '');
		const local = stripDial(digits);
		if (local.length > 0) {
			postQuizStore.setWhatsapp(dial + local);
		}
	}

	function stripDial(digits: string): string {
		if (digits.startsWith(selectedDial)) return digits.slice(selectedDial.length);
		return digits.slice(0, 15);
	}

	function formatPhone(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 15);
		if (selectedDial === '55') {
			// Brazilian format: (XX) XXXXX-XXXX
			const d = digits.slice(0, 11);
			if (d.length <= 2) return d ? `(${d}` : '';
			if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
			return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
		}
		// Generic: just digits
		return digits;
	}

	const displayValue = $derived.by(() => {
		if (!whatsapp) return '';
		const full = whatsapp.replace(/\D/g, '');
		const local = full.startsWith(selectedDial) ? full.slice(selectedDial.length) : full;
		return formatPhone(local);
	});

	function handlePhoneInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const digits = target.value.replace(/\D/g, '').slice(0, selectedDial === '55' ? 11 : 15);
		target.value = formatPhone(digits);
		if (digits.length > 0) {
			postQuizStore.setWhatsapp(selectedDial + digits);
		} else {
			postQuizStore.setWhatsapp('');
		}
	}

	function handleOutsideClick(e: MouseEvent) {
		if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
			dropdownOpen = false;
			searchQuery = '';
		}
	}

	$effect(() => {
		if (dropdownOpen) {
			document.addEventListener('mousedown', handleOutsideClick);
		} else {
			document.removeEventListener('mousedown', handleOutsideClick);
		}
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	});
</script>

<svelte:head>
	<title>Qual é o seu WhatsApp? | Zuppy</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-extrabold text-heading leading-tight">{whatsappTitle}</h1>
		<p class="text-sm text-body leading-[14px]">
			Digite seu WhatsApp para conectar nossa inteligência artificial ao seu número e receber seu plano de calorias personalizado para {objetivoLabel}.
		</p>
	</div>

	<div class="flex flex-col gap-3">
		<div class="flex gap-2 items-stretch">
			<!-- Country code selector -->
			<div class="relative" bind:this={dropdownEl}>
				<button
					type="button"
					onclick={() => { dropdownOpen = !dropdownOpen; searchQuery = ''; }}
					class="h-full px-3 rounded-2xl border-2 border-line bg-surface text-body font-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors flex items-center gap-1 min-w-[72px] justify-center"
					aria-haspopup="listbox"
					aria-expanded={dropdownOpen}
				>
					<span class="text-base">{selectedCountry?.flag}</span>
					<span class="text-sm">+{selectedDial}</span>
					<svg class="w-3 h-3 shrink-0 text-muted transition-transform {dropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
					</svg>
				</button>

				{#if dropdownOpen}
					<div
						class="absolute left-0 top-full mt-1 z-50 w-72 rounded-2xl border border-line bg-surface shadow-lg overflow-hidden"
						role="listbox"
					>
						<!-- Search -->
						<div class="p-2 border-b border-line">
							<input
								type="text"
								placeholder="Buscar país ou código..."
								bind:value={searchQuery}
								class="w-full px-3 py-2 text-sm rounded-xl border border-line bg-surface-2 text-body placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
								autofocus
							/>
						</div>
						<!-- List -->
						<ul class="max-h-56 overflow-y-auto py-1">
							{#each filteredCountries as country (country.name)}
								<li>
									<button
										type="button"
										role="option"
										aria-selected={selectedDial === country.dial && selectedCountry?.name === country.name}
										onclick={() => selectCountry(country.dial)}
										class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-surface-2 transition-colors text-left
											{selectedDial === country.dial && selectedCountry?.name === country.name ? 'bg-accent/10 font-medium text-accent' : ''}"
									>
										<span class="text-base shrink-0">{country.flag}</span>
										<span class="flex-1 truncate">{country.name}</span>
										<span class="text-muted shrink-0">+{country.dial}</span>
									</button>
								</li>
							{/each}
							{#if filteredCountries.length === 0}
								<li class="px-4 py-3 text-sm text-muted text-center">Nenhum resultado</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Phone input -->
			<input
				id="whatsapp-phone"
				aria-label="Número do WhatsApp"
				type="tel"
				inputmode="numeric"
				placeholder={selectedDial === '55' ? '(00) 00000-0000' : '000 000 0000'}
				value={displayValue}
				oninput={handlePhoneInput}
				class="flex-1 min-w-0 px-4 py-4 rounded-2xl border-2 border-line bg-surface text-body placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
				autocomplete="tel"
			/>
		</div>

		<p class="flex items-center justify-center gap-2 text-sm text-muted">
			<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
			</svg>
			Seu número está seguro. Não enviamos propaganda.
		</p>
	</div>
</div>
