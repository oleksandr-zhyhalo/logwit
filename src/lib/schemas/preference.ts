import * as v from 'valibot';

export const getPreferenceSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1))
});

export const saveDisplayFieldsSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1)),
	fields: v.array(v.string())
});

export const saveQuickFilterFieldsSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1)),
	fields: v.array(v.string())
});

export const deletePreferenceSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1))
});

export const getIndexFieldsSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1))
});
