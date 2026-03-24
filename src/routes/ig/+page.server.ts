import { redirect } from '@sveltejs/kit';

const IG_LINK = 'https://ob.zuppy.me/?utm_source=IG&utm_content=link-bio';

export function load() {
	redirect(302, IG_LINK);
}
