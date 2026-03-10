const INTERVAL_THRESHOLDS: [number, number][] = [
	[60 * 60, 10], // ≤1h  → 10s
	[6 * 60 * 60, 60], // ≤6h  → 1m
	[24 * 60 * 60, 600], // ≤24h → 10m
	[7 * 24 * 60 * 60, 3600], // ≤7d  → 1h
	[30 * 24 * 60 * 60, 21600] // ≤30d → 6h
];

export function computeHistogramInterval(windowSeconds: number): string {
	for (const [threshold, interval] of INTERVAL_THRESHOLDS) {
		if (windowSeconds <= threshold) {
			return `${interval}s`;
		}
	}
	return `${86400}s`;
}

export function computeHistogramIntervalSeconds(windowSeconds: number): number {
	for (const [threshold, interval] of INTERVAL_THRESHOLDS) {
		if (windowSeconds <= threshold) {
			return interval;
		}
	}
	return 86400;
}
