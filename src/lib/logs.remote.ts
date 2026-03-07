import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { source } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { searchLogsSchema } from '$lib/schemas/logs';
import { QuickwitClient } from 'quickwit-js';

export const searchLogs = command(searchLogsSchema, async (data) => {
	const event = getRequestEvent();
	if (!event.locals.user) {
		error(401, 'Unauthorized');
	}

	const [src] = await db.select().from(source).where(eq(source.id, data.sourceId));
	if (!src) {
		error(404, 'Source not found');
	}

	// QuickwitClient adds /api/v1 internally, so strip it if present
	const endpoint = src.url.replace(/\/api\/v1\/?$/, '');
	const client = new QuickwitClient(endpoint);
	const index = client.index(src.indexName);

	let startTs: number | undefined;
	let endTs: number | undefined;

	if (data.startTimestamp !== undefined && data.endTimestamp !== undefined) {
		startTs = data.startTimestamp;
		endTs = data.endTimestamp;
	} else if (data.timeRange !== 'all') {
		endTs = Math.floor(Date.now() / 1000);
		const rangeSeconds: Record<string, number> = {
			'15m': 15 * 60,
			'1h': 60 * 60,
			'6h': 6 * 60 * 60,
			'24h': 24 * 60 * 60,
			'7d': 7 * 24 * 60 * 60
		};
		startTs = endTs - (rangeSeconds[data.timeRange] ?? 900);
	}

	const query = index
		.query(data.query || '*')
		.limit(data.limit)
		.offset(data.offset)
		.sortBy(`+${src.timestampField}`);

	if (startTs !== undefined && endTs !== undefined) {
		query.timeRange(startTs, endTs);
	}

	const result = await index.search(query);

	return {
		hits: result.hits,
		numHits: result.num_hits,
		startTimestamp: startTs,
		endTimestamp: endTs
	};
});
