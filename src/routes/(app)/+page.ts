import { deserialize } from '$lib/query-params';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		parsedQuery: deserialize(url.searchParams)
	};
};
