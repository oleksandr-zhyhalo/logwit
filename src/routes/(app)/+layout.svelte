<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { signOut } from '$lib/auth.remote';

	let { children } = $props();
</script>

<div class="flex min-h-screen">
	<aside class="flex w-64 flex-col border-r border-base-300 bg-base-200">
		<div class="border-b border-base-300 p-4 text-lg font-bold">Logwit</div>
		<ul class="menu w-full flex-1 p-2">
			<li>
				<a href="/" class:active={page.url.pathname === '/'}>
					<Icon icon="lucide:house" width="20" height="20" />
					Home
				</a>
			</li>
			<li>
				<a href="/logs" class:active={page.url.pathname.startsWith('/logs')}>
					<Icon icon="lucide:file-text" width="20" height="20" />
					Logs
				</a>
			</li>
			<li>
				<a href="/settings" class:active={page.url.pathname.startsWith('/settings')}>
					<Icon icon="lucide:settings" width="20" height="20" />
					Settings
				</a>
			</li>
		</ul>
		<div class="border-t border-base-300 p-2">
			<button class="btn w-full btn-ghost btn-sm" onclick={() => signOut()}>
				<Icon icon="lucide:log-out" width="16" height="16" />
				Sign Out
			</button>
		</div>
	</aside>
	<main class="flex-1 p-6">
		{@render children()}
	</main>
</div>
