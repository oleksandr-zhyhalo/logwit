import * as v from 'valibot';

export const getFieldPreferenceSchema = v.object({
	sourceId: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
});

export const saveFieldPreferenceSchema = v.object({
	sourceId: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))),
	fields: v.array(v.string())
});

export const deleteFieldPreferenceSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1))
});

export const getIndexFieldsSchema = v.object({
	sourceId: v.pipe(v.number(), v.integer(), v.minValue(1))
});
