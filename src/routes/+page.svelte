<script lang="ts">
	import { signOut } from '$lib/auth.remote';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="card w-full max-w-sm bg-base-100 shadow-sm">
		<div class="card-body items-center text-center">
			<h2 class="card-title">Welcome to Logwit</h2>
			<p class="text-base-content/60">You are signed in.</p>
			<button class="btn btn-neutral btn-sm mt-2" onclick={() => signOut()}>Sign Out</button>
		</div>
	</div>
</div>
