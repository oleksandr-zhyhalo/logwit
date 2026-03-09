import { describe, it, expect } from 'vitest';
import { serialize, deserialize, buildQueryUrl, hasNonDefaultParams } from './query-params';

describe('serialize', () => {
	it('serializes default state to minimal params', () => {
		const params = serialize({
			sourceId: null,
			query: '',
			filters: {},
			timeRange: { type: 'relative', preset: '15m' },
			timezoneMode: 'local'
		});
		// Defaults are omitted
		expect(params.toString()).toBe('');
	});

	it('serializes source and query', () => {
		const params = serialize({
			sourceId: 1,
			query: 'level:error',
			filters: {},
			timeRange: { type: 'relative', preset: '15m' },
			timezoneMode: 'local'
		});
		expect(params.get('source')).toBe('1');
		expect(params.get('q')).toBe('level:error');
		expect(params.has('from')).toBe(false); // default omitted
		expect(params.has('tz')).toBe(false); // default omitted
	});

	it('serializes filters with f. prefix', () => {
		const params = serialize({
			sourceId: 1,
			query: '',
			filters: { level: ['error', 'warn'], service: ['api'] },
			timeRange: { type: 'relative', preset: '15m' },
			timezoneMode: 'local'
		});
		expect(params.get('f.level')).toBe('error,warn');
		expect(params.get('f.service')).toBe('api');
	});

	it('serializes relative time range', () => {
		const params = serialize({
			sourceId: null,
			query: '',
			filters: {},
			timeRange: { type: 'relative', preset: '1h' },
			timezoneMode: 'local'
		});
		expect(params.get('from')).toBe('1h');
		expect(params.has('to')).toBe(false);
	});

	it('serializes absolute time range', () => {
		const params = serialize({
			sourceId: null,
			query: '',
			filters: {},
			timeRange: { type: 'absolute', start: 1709913600, end: 1709917200 },
			timezoneMode: 'local'
		});
		expect(params.get('from')).toBe('1709913600');
		expect(params.get('to')).toBe('1709917200');
	});

	it('serializes timezone mode when not default', () => {
		const params = serialize({
			sourceId: null,
			query: '',
			filters: {},
			timeRange: { type: 'relative', preset: '15m' },
			timezoneMode: 'utc'
		});
		expect(params.get('tz')).toBe('utc');
	});

	it('URL-encodes filter values containing commas', () => {
		const params = serialize({
			sourceId: null,
			query: '',
			filters: { tag: ['a,b', 'c'] },
			timeRange: { type: 'relative', preset: '15m' },
			timezoneMode: 'local'
		});
		const raw = params.get('f.tag');
		expect(raw).toBeTruthy();
	});
});

describe('deserialize', () => {
	it('returns defaults for empty params', () => {
		const result = deserialize(new URLSearchParams());
		expect(result.sourceId).toBe(null);
		expect(result.query).toBe('');
		expect(result.filters).toEqual({});
		expect(result.timeRange).toEqual({ type: 'relative', preset: '15m' });
		expect(result.timezoneMode).toBe('local');
	});

	it('parses source and query', () => {
		const params = new URLSearchParams('source=1&q=level:error');
		const result = deserialize(params);
		expect(result.sourceId).toBe(1);
		expect(result.query).toBe('level:error');
	});

	it('parses filters with f. prefix', () => {
		const params = new URLSearchParams('f.level=error,warn&f.service=api');
		const result = deserialize(params);
		expect(result.filters).toEqual({
			level: ['error', 'warn'],
			service: ['api']
		});
	});

	it('parses relative time range', () => {
		const params = new URLSearchParams('from=1h');
		const result = deserialize(params);
		expect(result.timeRange).toEqual({ type: 'relative', preset: '1h' });
	});

	it('parses absolute time range', () => {
		const params = new URLSearchParams('from=1709913600&to=1709917200');
		const result = deserialize(params);
		expect(result.timeRange).toEqual({ type: 'absolute', start: 1709913600, end: 1709917200 });
	});

	it('parses timezone mode', () => {
		const params = new URLSearchParams('tz=utc');
		const result = deserialize(params);
		expect(result.timezoneMode).toBe('utc');
	});

	it('ignores invalid source id', () => {
		const params = new URLSearchParams('source=abc');
		const result = deserialize(params);
		expect(result.sourceId).toBe(null);
	});

	it('ignores invalid timezone', () => {
		const params = new URLSearchParams('tz=pacific');
		const result = deserialize(params);
		expect(result.timezoneMode).toBe('local');
	});

	it('falls back to relative for invalid from value', () => {
		const params = new URLSearchParams('from=bogus');
		const result = deserialize(params);
		expect(result.timeRange).toEqual({ type: 'relative', preset: '15m' });
	});
});

describe('serialize/deserialize roundtrip', () => {
	it('roundtrips a full query', () => {
		const original = {
			sourceId: 3,
			query: 'message:"server error" AND status:500',
			filters: { level: ['error', 'warn'], service: ['api', 'auth'] },
			timeRange: { type: 'absolute' as const, start: 1709913600, end: 1709917200 },
			timezoneMode: 'utc' as const
		};
		const params = serialize(original);
		const restored = deserialize(params);
		expect(restored).toEqual(original);
	});

	it('roundtrips defaults', () => {
		const original = {
			sourceId: null,
			query: '',
			filters: {},
			timeRange: { type: 'relative' as const, preset: '15m' },
			timezoneMode: 'local' as const
		};
		const params = serialize(original);
		const restored = deserialize(params);
		expect(restored).toEqual(original);
	});

	it('roundtrips filter values with commas', () => {
		const original = {
			sourceId: null,
			query: '',
			filters: { tag: ['a,b', 'c'] },
			timeRange: { type: 'relative' as const, preset: '15m' },
			timezoneMode: 'local' as const
		};
		const params = serialize(original);
		const restored = deserialize(params);
		expect(restored.filters).toEqual(original.filters);
	});
});

describe('hasNonDefaultParams', () => {
	it('returns false for default state', () => {
		expect(
			hasNonDefaultParams({
				sourceId: null,
				query: '',
				filters: {},
				timeRange: { type: 'relative', preset: '15m' },
				timezoneMode: 'local'
			})
		).toBe(false);
	});

	it('returns false for source-only state', () => {
		expect(
			hasNonDefaultParams({
				sourceId: 1,
				query: '',
				filters: {},
				timeRange: { type: 'relative', preset: '15m' },
				timezoneMode: 'local'
			})
		).toBe(false);
	});

	it('returns true when query is set', () => {
		expect(
			hasNonDefaultParams({
				sourceId: 1,
				query: 'level:error',
				filters: {},
				timeRange: { type: 'relative', preset: '15m' },
				timezoneMode: 'local'
			})
		).toBe(true);
	});

	it('returns true when filters are set', () => {
		expect(
			hasNonDefaultParams({
				sourceId: 1,
				query: '',
				filters: { level: ['error'] },
				timeRange: { type: 'relative', preset: '15m' },
				timezoneMode: 'local'
			})
		).toBe(true);
	});

	it('returns true for absolute time range', () => {
		expect(
			hasNonDefaultParams({
				sourceId: 1,
				query: '',
				filters: {},
				timeRange: { type: 'absolute', start: 1000, end: 2000 },
				timezoneMode: 'local'
			})
		).toBe(true);
	});
});

describe('buildQueryUrl', () => {
	it('merges partial state into existing params', () => {
		const current = new URLSearchParams('source=1&q=hello&from=1h');
		const url = buildQueryUrl(current, { query: 'goodbye' });
		const result = deserialize(new URLSearchParams(url));
		expect(result.sourceId).toBe(1);
		expect(result.query).toBe('goodbye');
		expect(result.timeRange).toEqual({ type: 'relative', preset: '1h' });
	});

	it('clears filters when setting empty object', () => {
		const current = new URLSearchParams('source=1&f.level=error');
		const url = buildQueryUrl(current, { filters: {} });
		expect(url).not.toContain('f.level');
	});

	it('returns just the search string portion', () => {
		const current = new URLSearchParams();
		const url = buildQueryUrl(current, { sourceId: 5 });
		expect(url).toBe('?source=5');
	});
});
