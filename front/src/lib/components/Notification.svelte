<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';

	// --- State ---
	// Reactive access to the error state from the store. $derived ensures this updates
	// whenever resourceStore.error changes.
	let currentError = $derived(resourceStore.error);
	// Local state to control the visibility of the notification element.
	let isVisible = $state(false);
	// Local state to hold the message content to display.
	let message = $state('');

	// --- Effects ---
	// This effect runs whenever 'currentError' (derived from the store) changes.
	$effect(() => {
		if (currentError) {
			// If there's an error message in the store:
			message = currentError; // Set the local message state.
			isVisible = true; // Make the notification visible.

			// Auto-hide functionality: Set a timer to hide the notification after 5 seconds.
			const timer = setTimeout(() => {
				isVisible = false;
				// Optional: Clear the error in the store once the notification hides automatically.
				// This prevents the notification from reappearing if the component remounts
				// unless a *new* error is set in the store.
				// You would need to add a `clearError` function to resourceStore.js:
				// Example in store: clearError: () => { error = null; }
				// resourceStore.clearError();
			}, 5000); // 5000 milliseconds = 5 seconds

			// Cleanup function: This runs if the effect re-runs before the timer finishes
			// (e.g., if a new error comes in quickly) or when the component is unmounted.
			// It prevents the old timer from hiding the notification prematurely.
			return () => clearTimeout(timer);
		} else {
			// If there's no error in the store (currentError is null or empty):
			isVisible = false; // Ensure the notification is hidden.
		}
	});

	// --- Event Handlers ---
	/**
	 * Closes the notification manually when the close button is clicked.
	 */
	function closeNotification() {
		isVisible = false;
		// Optional: Immediately clear the error in the store upon manual dismissal.
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
				onclick={closeNotification}
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
