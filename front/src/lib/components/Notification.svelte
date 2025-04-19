<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';

	// Local state
	let isVisible = false;
	let message = '';
	let timerHandle = null;

	// Subscribe to the error store
	const unsubscribe = resourceStore.error.subscribe((currentError) => {
		if (currentError) {
			message = currentError;
			isVisible = true;

			// Clear any existing timer
			if (timerHandle) clearTimeout(timerHandle);

			// Auto-hide after 5 seconds
			timerHandle = setTimeout(() => {
				isVisible = false;
				// Optional: Clear the error in the store
				// resourceStore.clearError();
			}, 5000);
		} else {
			isVisible = false;
		}
	});

	// Clean up subscription when component is destroyed
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (timerHandle) clearTimeout(timerHandle);
		unsubscribe();
	});

	// Close notification manually
	function closeNotification() {
		isVisible = false;
		// Optional: Clear the error in the store
		// resourceStore.clearError();
	}
</script>

{#if isVisible}
	<div
		class="fixed right-4 bottom-4 z-50 max-w-sm rounded-md border border-red-300 bg-red-100 p-4 text-red-700 shadow-lg"
		role="alert"
		aria-live="assertive"
	>
		<div class="flex items-start justify-between">
			<div>
				<strong class="font-bold">Error!</strong>
				<span class="block sm:inline">{message}</span>
			</div>
			<button
				on:click={closeNotification}
				class="-mt-1 -mr-1 ml-4 rounded-md p-1 text-red-500 hover:bg-red-200 focus:ring-2 focus:ring-red-400 focus:outline-none"
				aria-label="Close Notification"
			>
				<svg class="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}
