import { command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userPreference, source } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { QuickwitClient } from 'quickwit-js';
import {
	getPreferenceSchema,
	saveDisplayFieldsSchema,
	saveQuickFilterFieldsSchema,
	deletePreferenceSchema,
	getIndexFieldsSchema
} from '$lib/schemas/preference';
import { requireUser } from '$lib/middleware/auth';
import { normalizeQuickwitUrl } from '$lib/utils';

export const getPreference = command(getPreferenceSchema, async (data) => {
	const user = requireUser();

	// Try per-source first
	if (data.sourceId !== null) {
		const [pref] = await db
			.select()
			.from(userPreference)
			.where(
				and(
					eq(userPreference.userId, user.id),
					eq(userPreference.sourceId, data.sourceId)
				)
			);
		if (pref) {
			return {
				displayFields: (pref.displayFields as string[]) ?? [],
				quickFilterFields: (pref.quickFilterFields as string[]) ?? [],
				isOverride: true
			};
		}
	}

	// Fallback to global default
	const [globalPref] = await db
		.select()
		.from(userPreference)
		.where(
			and(
				eq(userPreference.userId, user.id),
				isNull(userPreference.sourceId)
			)
		);

	return {
		displayFields: (globalPref?.displayFields as string[]) ?? [],
		quickFilterFields: (globalPref?.quickFilterFields as string[]) ?? [],
		isOverride: false
	};
});

export const saveDisplayFields = command(saveDisplayFieldsSchema, async (data) => {
	const user = requireUser();

	await db
		.insert(userPreference)
		.values({
			userId: user.id,
			sourceId: data.sourceId,
			displayFields: data.fields
		})
		.onConflictDoUpdate({
			target: [userPreference.userId, userPreference.sourceId],
			set: { displayFields: data.fields, updatedAt: new Date() }
		});
});

export const saveQuickFilterFields = command(saveQuickFilterFieldsSchema, async (data) => {
	const user = requireUser();

	await db
		.insert(userPreference)
		.values({
			userId: user.id,
			sourceId: data.sourceId,
			quickFilterFields: data.fields
		})
		.onConflictDoUpdate({
			target: [userPreference.userId, userPreference.sourceId],
			set: { quickFilterFields: data.fields, updatedAt: new Date() }
		});
});

export const deletePreference = command(deletePreferenceSchema, async (data) => {
	const user = requireUser();
	await db
		.delete(userPreference)
		.where(
			and(
				eq(userPreference.userId, user.id),
				eq(userPreference.sourceId, data.sourceId)
			)
		);
});

export const getIndexFields = command(getIndexFieldsSchema, async (data) => {
	requireUser();

	const [src] = await db.select().from(source).where(eq(source.id, data.sourceId));
	if (!src) error(404, 'Source not found');

	const endpoint = normalizeQuickwitUrl(src.url);
	const client = new QuickwitClient(endpoint);
	const metadata = await client.getIndex(src.indexName);

	const fieldMappings = metadata.index_config.doc_mapping.field_mappings;

	function flattenFields(
		mappings: typeof fieldMappings,
		prefix = ''
	): { name: string; type: string }[] {
		const result: { name: string; type: string }[] = [];
		for (const f of mappings) {
			const fullName = prefix ? `${prefix}.${f.name}` : f.name;
			if (f.type === 'object' && f.field_mappings) {
				result.push(...flattenFields(f.field_mappings, fullName));
			} else {
				result.push({ name: fullName, type: f.type });
			}
		}
		return result;
	}

	return flattenFields(fieldMappings);
});
