<script lang="ts">
	import { browser } from '$app/environment';
	import type uPlotLib from 'uplot';
	import type { TimezoneMode } from '$lib/types';
	import Icon from '@iconify/svelte';

	let {
		data,
		timezoneMode,
		loading,
		collapsed,
		ontoggle,
		onbrush
	}: {
		data: { timestamp: number; levels: Record<string, number> }[];
		timezoneMode: TimezoneMode;
		loading: boolean;
		collapsed: boolean;
		ontoggle: () => void;
		onbrush: (start: number, end: number) => void;
	} = $props();

	const LEVEL_ORDER = ['DEBUG', 'INFO', 'WARN', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL'] as const;

	const LEVEL_COLORS: Record<string, string> = {
		DEBUG: '#22d3ee',
		INFO: '#3b82f6',
		WARN: '#f59e0b',
		WARNING: '#f59e0b',
		ERROR: '#ef4444',
		CRITICAL: '#ec4899',
		FATAL: '#ec4899'
	};

	const FALLBACK_COLOR = '#8b5cf6';

	let containerEl = $state<HTMLDivElement | null>(null);
	let chartEl = $state<HTMLDivElement | null>(null);
	let chartWidth = $state(400);
	let chart: uPlotLib | null = null;
	let uPlotCtor: typeof uPlotLib | null = null;

	// Collect all unique levels from data in the defined stacking order
	let levels = $derived.by(() => {
		const seen = new Set<string>();
		for (const bucket of data) {
			for (const key of Object.keys(bucket.levels)) {
				seen.add(key.toUpperCase());
			}
		}
		const ordered: string[] = [];
		for (const level of LEVEL_ORDER) {
			if (seen.has(level)) {
				ordered.push(level);
				seen.delete(level);
			}
		}
		// Any remaining levels not in LEVEL_ORDER
		for (const level of seen) {
			ordered.push(level);
		}
		return ordered;
	});

	// Build columnar data for uPlot: [timestamps, ...stackedSeries]
	let columnarData = $derived.by(() => {
		if (data.length === 0) return null;

		const timestamps: number[] = data.map((b) => b.timestamp);
		const rawSeries: number[][] = levels.map((level) =>
			data.map((b) => {
				// Match case-insensitively
				const key = Object.keys(b.levels).find((k) => k.toUpperCase() === level);
				return key ? (b.levels[key] ?? 0) : 0;
			})
		);

		// Build stacked series (cumulative)
		const stackedSeries: number[][] = [];
		for (let i = 0; i < rawSeries.length; i++) {
			const stacked = new Array<number>(timestamps.length);
			for (let j = 0; j < timestamps.length; j++) {
				stacked[j] = rawSeries[i][j] + (i > 0 ? stackedSeries[i - 1][j] : 0);
			}
			stackedSeries.push(stacked);
		}

		return [timestamps, ...stackedSeries] as [number[], ...number[][]];
	});

	function formatTime(ts: number): string {
		const d = new Date(ts * 1000);
		if (timezoneMode === 'utc') {
			const h = String(d.getUTCHours()).padStart(2, '0');
			const m = String(d.getUTCMinutes()).padStart(2, '0');
			return `${h}:${m}`;
		}
		const h = String(d.getHours()).padStart(2, '0');
		const m = String(d.getMinutes()).padStart(2, '0');
		return `${h}:${m}`;
	}

	function formatDate(ts: number): string {
		const d = new Date(ts * 1000);
		if (timezoneMode === 'utc') {
			const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
			const day = String(d.getUTCDate()).padStart(2, '0');
			return `${mo}-${day} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
		}
		const mo = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${mo}-${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	function destroyChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}
	}

	async function buildChart() {
		if (!browser || !chartEl || collapsed || !columnarData) return;

		destroyChart();

		if (!uPlotCtor) {
			const mod = await import('uplot');
			uPlotCtor = mod.default;
		}

		// Re-check state after async import — user may have collapsed or unmounted
		if (!chartEl || collapsed || !columnarData) return;

		const UPlot = uPlotCtor;

		const barPaths = UPlot.paths.bars!({ size: [0.8, 64], align: 0 });

		const series: uPlotLib.Series[] = [
			{
				label: 'Time'
			}
		];

		const bands: uPlotLib.Band[] = [];

		for (let i = 0; i < levels.length; i++) {
			const level = levels[i];
			const color = LEVEL_COLORS[level] ?? FALLBACK_COLOR;

			series.push({
				label: level,
				fill: color + '99',
				stroke: color,
				width: 0,
				paths: barPaths,
				points: { show: false }
			});

			// Bands connect stacked series for fill between them
			if (i > 0) {
				bands.push({
					series: [i + 1, i] as [number, number],
					fill: (LEVEL_COLORS[levels[i]] ?? FALLBACK_COLOR) + '99'
				});
			}
		}

		// Determine time span to choose label formatter
		const timestamps = columnarData[0];
		const span = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;
		const useDate = span > 24 * 60 * 60;

		const opts: uPlotLib.Options = {
			width: chartWidth,
			height: 150,
			series,
			bands,
			cursor: {
				drag: {
					x: true,
					y: false,
					setScale: false
				}
			},
			select: {
				show: true,
				left: 0,
				top: 0,
				width: 0,
				height: 0
			},
			legend: {
				show: false
			},
			scales: {
				x: {
					time: true
				},
				y: {
					range: (_u: uPlotLib, _min: number, max: number) => [0, max || 1]
				}
			},
			axes: [
				{
					stroke: '#9ca3af',
					grid: { show: false },
					ticks: { show: false },
					space: 120,
					values: (_u: uPlotLib, splits: number[]) =>
						splits.map((v) => (useDate ? formatDate(v) : formatTime(v)))
				},
				{
					stroke: '#9ca3af',
					grid: { show: false },
					ticks: { show: false },
					size: 50
				}
			],
			hooks: {
				setSelect: [
					(u: uPlotLib) => {
						const left = u.select.left;
						const width = u.select.width;
						if (width > 2) {
							const startTs = Math.floor(u.posToVal(left, 'x'));
							const endTs = Math.ceil(u.posToVal(left + width, 'x'));
							onbrush(startTs, endTs);
						}
						u.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false);
					}
				]
			}
		};

		chart = new UPlot(opts, columnarData, chartEl);
	}

	// ResizeObserver for responsive width
	$effect(() => {
		if (!browser || !containerEl) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const w = entry.contentRect.width;
				if (w > 0 && Math.abs(w - chartWidth) > 1) {
					chartWidth = w;
				}
			}
		});

		ro.observe(containerEl);

		return () => ro.disconnect();
	});

	// Rebuild chart when data, timezoneMode, or collapsed state changes
	$effect(() => {
		// Track reactive dependencies (not chartWidth -- resize is handled separately)
		void columnarData;
		void timezoneMode;
		void collapsed;

		if (browser && !collapsed && columnarData && chartEl) {
			buildChart();
		} else if (collapsed) {
			destroyChart();
		}

		return () => {
			destroyChart();
		};
	});

	// Resize chart when width changes (without full rebuild)
	$effect(() => {
		if (chart && chartWidth > 0) {
			chart.setSize({ width: chartWidth, height: 150 });
		}
	});
</script>

<div class="border-b border-base-300">
	<div class="flex items-center gap-2 px-3 py-1.5">
		<button class="flex items-center gap-1" onclick={ontoggle}>
			<Icon
				icon={collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'}
				width="14"
				height="14"
				class="text-base-content/40"
			/>
			<span class="text-xs font-semibold tracking-wider text-base-content/80 uppercase">
				Frequency chart
			</span>
		</button>
		{#if loading}
			<span class="loading loading-spinner loading-xs text-base-content/40"></span>
		{/if}
	</div>

	{#if !collapsed}
		<div bind:this={containerEl} class="px-2 pb-2">
			<div bind:this={chartEl}></div>

			{#if levels.length > 0}
				<div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1">
					{#each levels as level (level)}
						<div class="flex items-center gap-1">
							<span
								class="inline-block h-2.5 w-2.5 rounded-sm"
								style="background-color: {LEVEL_COLORS[level] ?? FALLBACK_COLOR}"
							></span>
							<span class="text-[11px] text-base-content/60">{level}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
