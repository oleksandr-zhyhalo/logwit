import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { user, session } = event.locals;

	if (!user && !event.url.pathname.startsWith('/auth')) {
		redirect(302, '/auth/sign-in');
	}

	return { user: user ?? null, session: session ?? null };
};
