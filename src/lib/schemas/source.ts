import * as v from 'valibot';

export const sourceSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	url: v.pipe(v.string(), v.url('Please enter a valid URL')),
	indexName: v.pipe(v.string(), v.minLength(1, 'Index name is required'))
});

export const sourceIdSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

export const updateSourceSchema = v.object({
	id: sourceIdSchema,
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	url: v.pipe(v.string(), v.url('Please enter a valid URL')),
	indexName: v.pipe(v.string(), v.minLength(1, 'Index name is required'))
});

export const testConnectionSchema = v.object({
	url: v.pipe(v.string(), v.url('Please enter a valid URL')),
	indexName: v.pipe(v.string(), v.minLength(1, 'Index name is required'))
});
