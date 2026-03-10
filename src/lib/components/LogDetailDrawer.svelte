<script lang="ts">
	import type { Snippet } from 'svelte';
	import JsonHighlight from '$lib/components/JsonHighlight.svelte';
	import Icon from '@iconify/svelte';

	let {
		open = $bindable(false),
		hit = null,
		children
	}: {
		open: boolean;
		hit: Record<string, unknown> | null;
		children: Snippet;
	} = $props();

	const drawerId = 'log-detail-drawer';

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: 'lucide:table' },
		{ id: 'json', label: 'JSON', icon: 'lucide:braces' },
		{ id: 'context', label: 'Context', icon: 'lucide:list' },
		{ id: 'metrics', label: 'Metrics', icon: 'lucide:bar-chart-3' }
	] as const;

	let activeTab = $state<(typeof tabs)[number]['id']>('json');
	let copied = $state(false);

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}

	const prettyJson = $derived(hit ? JSON.stringify(hit, null, 2) : '');
	const jsonLines = $derived(prettyJson.split('\n'));

	async function copyJson() {
		await navigator.clipboard.writeText(prettyJson);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="drawer drawer-end">
	<input
		id={drawerId}
		type="checkbox"
		class="drawer-toggle"
		checked={open}
		onchange={(e) => (open = e.currentTarget.checked)}
	/>
	<div class="drawer-content">
		{@render children()}
	</div>
	<div class="drawer-side z-50">
		<label for={drawerId} aria-label="close sidebar" class="drawer-overlay"></label>
		<div class="flex h-full w-[50vw] flex-col bg-base-100">
			<div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
				<span class="text-sm font-semibold">Log Detail</span>
				<button class="btn btn-square btn-ghost btn-sm" onclick={close}>
					<Icon icon="lucide:x" width="16" height="16" />
				</button>
			</div>

			<div role="tablist" class="tabs tabs-border px-4">
				{#each tabs as tab (tab.id)}
					<button
						role="tab"
						class="tab gap-1.5"
						class:tab-active={activeTab === tab.id}
						onclick={() => (activeTab = tab.id)}
					>
						<Icon icon={tab.icon} width="14" height="14" />
						{tab.label}
					</button>
				{/each}
			</div>

			<div class="flex-1 overflow-auto p-4">
				{#if activeTab === 'json'}
					{#if hit}
						<div class="bg-base-200 rounded-box relative">
							<button
								class="btn btn-ghost btn-xs absolute top-2 right-2 z-10"
								onclick={copyJson}
							>
								<Icon
									icon={copied ? 'lucide:check' : 'lucide:copy'}
									width="14"
									height="14"
								/>
							</button>
							<div class="flex font-mono text-sm">
								<div
									class="text-base-content/30 select-none border-r border-base-300 py-3 pr-3 pl-3 text-right"
								>
									{#each jsonLines as _, i (i)}
										<div class="leading-relaxed">{i + 1}</div>
									{/each}
								</div>
								<div class="flex-1 overflow-x-auto py-3 pl-3 pr-3">
									<JsonHighlight code={prettyJson} />
								</div>
							</div>
						</div>
					{/if}
				{:else if activeTab === 'overview'}
					<p class="text-base-content/50 text-sm">Coming soon</p>
				{:else if activeTab === 'context'}
					<p class="text-base-content/50 text-sm">Coming soon</p>
				{:else if activeTab === 'metrics'}
					<p class="text-base-content/50 text-sm">Coming soon</p>
				{/if}
			</div>
		</div>
	</div>
</div>
