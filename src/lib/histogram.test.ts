import { describe, it, expect } from 'vitest';
import { computeHistogramInterval } from './histogram';

describe('computeHistogramInterval', () => {
	it('returns 10s for 5m window', () => {
		expect(computeHistogramInterval(5 * 60)).toBe('10s');
	});

	it('returns 10s for 15m window', () => {
		expect(computeHistogramInterval(15 * 60)).toBe('10s');
	});

	it('returns 10s for 1h window', () => {
		expect(computeHistogramInterval(60 * 60)).toBe('10s');
	});

	it('returns 1m for 3h window', () => {
		expect(computeHistogramInterval(3 * 60 * 60)).toBe('60s');
	});

	it('returns 1m for 6h window', () => {
		expect(computeHistogramInterval(6 * 60 * 60)).toBe('60s');
	});

	it('returns 10m for 1d window', () => {
		expect(computeHistogramInterval(24 * 60 * 60)).toBe('600s');
	});

	it('returns 1h for 3d window', () => {
		expect(computeHistogramInterval(3 * 24 * 60 * 60)).toBe('3600s');
	});

	it('returns 1h for 1w window', () => {
		expect(computeHistogramInterval(7 * 24 * 60 * 60)).toBe('3600s');
	});

	it('returns 6h for 1M window', () => {
		expect(computeHistogramInterval(30 * 24 * 60 * 60)).toBe('21600s');
	});

	it('returns 1d for windows larger than 1M', () => {
		expect(computeHistogramInterval(90 * 24 * 60 * 60)).toBe('86400s');
	});
});
