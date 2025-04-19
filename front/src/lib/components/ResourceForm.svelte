<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';

	// --- Props ---
	/** @type {import('./types').Resource | null} */ // Optional JSDoc type hint
	export let resource = null; // Existing resource data for editing, or null for creating.
	export let onclose = () => {}; // Callback to close/hide the form.

	// --- State ---
	// Reactive object holding the form field values.
	let formData = $state({
		title: '',
		description: '',
		tags: '' // Tags are handled as a single comma-separated string in the input field.
	});
	// Holds the File object selected by the user for the main resource file (resource_file).
	let selectedFile = $state(null);
	// Tracks if the form is currently submitting to the API (disables inputs/buttons).
	let isSubmitting = $state(false);
	// Stores any error message specific to this form submission.
	let formError = $state(null);

	// --- Initialization and Reactivity ---
	// This effect runs whenever the 'resource' prop changes. It initializes or resets
	// the form fields based on whether we are creating or editing.
	$effect(() => {
		if (resource && resource.id) {
			// EDIT MODE: Populate form with existing resource data.
			formData.title = resource.title || '';
			formData.description = resource.description || '';
			// Use the raw 'tags' string from the resource for the input field.
			formData.tags = resource.tags || '';
			// Reset file input; user must re-select if they want to replace the file.
			selectedFile = null;
		} else {
			// CREATE MODE: Reset form fields to empty.
			formData.title = '';
			formData.description = '';
			formData.tags = '';
			selectedFile = null;
		}
		// Clear any previous form errors and reset submission state when mode changes.
		formError = null;
		isSubmitting = false;

		// If the form includes a file input element, reset it visually.
		// Note: Programmatically clearing file inputs can be tricky and might require
		// accessing the DOM element directly if the simple state reset isn't enough.
		const fileInput = document.getElementById('resource_file');
		if (fileInput) {
			fileInput.value = ''; // Attempt to reset the file input display
		}
	});

	// --- Event Handlers ---
	/**
	 * Handles changes to the file input field.
	 * Updates the `selectedFile` state with the chosen File object.
	 * @param {Event} event - The input change event.
	 */
	function handleFileChange(event) {
		const files = event.target.files;
		if (files && files.length > 0) {
			selectedFile = files[0]; // Store the File object
		} else {
			selectedFile = null; // Clear if no file is selected
		}
	}

	/**
	 * Handles the form submission.
	 * Determines whether to call the 'add' or 'update' action in the store.
	 * Manages loading state and displays errors locally.
	 */
	async function handleSubmit() {
		isSubmitting = true;
		formError = null; // Clear previous errors

		try {
			if (resource && resource.id) {
				// --- UPDATE Resource (PATCH request) ---
				const updateData = {
					// Include all fields that can be updated
					title: formData.title,
					description: formData.description,
					tags: formData.tags // Send the comma-separated string
				};
				// The `updateResource` store action expects the resource ID, the data payload,
				// and the File object (or undefined/null if not changing the file).
				await resourceStore.updateResource(resource.id, updateData, selectedFile);
				console.log('Resource updated successfully via form.');
			} else {
				// --- CREATE Resource (POST request) ---
				const createData = {
					title: formData.title,
					description: formData.description,
					tags: formData.tags // Send the comma-separated string
				};
				// The `addResource` store action expects the data payload and the File object.
				await resourceStore.addResource(createData, selectedFile);
				console.log('Resource added successfully via form.');
			}
			// If API call succeeds, call the onclose callback to hide the form.
			onclose();
		} catch (err) {
			// Handle errors from the API call (validation errors, server errors, etc.)
			console.error('Resource form submission failed:', err);
			// Attempt to extract and display meaningful error messages.
			// This structure assumes DRF validation errors might be in err.data object.
			if (err.data && typeof err.data === 'object') {
				formError = Object.entries(err.data)
					.map(
						([field, messages]) =>
							`${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
					)
					.join('; ');
			} else {
				// Fallback to generic error message.
				formError = err.message || 'An unexpected error occurred. Please try again.';
			}
			// Note: The global Notification component will also display the error set in the store.
		} finally {
			// Ensure loading state is turned off regardless of success or failure.
			isSubmitting = false;
		}
	}
</script>

<form onsubmit|preventDefault={handleSubmit} class="space-y-4">
	<h3 class="text-lg leading-6 font-medium text-gray-900">
		{resource ? 'Edit Resource' : 'Add New Resource'}
	</h3>

	{#if formError}
		<div class="rounded-md bg-red-50 p-3">
			<p class="text-sm text-red-700">{formError}</p>
		</div>
	{/if}

	<div>
		<label for="title" class="block text-sm font-medium text-gray-700">Title *</label>
		<input
			type="text"
			id="title"
			bind:value={formData.title}
			required
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 sm:text-sm"
			disabled={isSubmitting}
			aria-describedby="title-required"
		/>
		<span id="title-required" class="sr-only">Title is required</span>
	</div>

	<div>
		<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
		<textarea
			id="description"
			rows="3"
			bind:value={formData.description}
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 sm:text-sm"
			disabled={isSubmitting}
		></textarea>
	</div>

	<div>
		<label for="tags" class="block text-sm font-medium text-gray-700">Tags</label>
		<input
			type="text"
			id="tags"
			bind:value={formData.tags}
			placeholder="Enter comma-separated tags (e.g., svelte, django, webdev)"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 sm:text-sm"
			disabled={isSubmitting}
			aria-describedby="tags-description"
		/>
		<p id="tags-description" class="mt-1 text-xs text-gray-500">Separate tags with commas.</p>
	</div>

	<div>
		<label for="resource_file" class="block text-sm font-medium text-gray-700">
			Attach File
			{#if resource && resource.resource_file_url}
				(Optional: Select file to replace existing)
			{:else}
				(Optional)
			{/if}
		</label>
		<input
			type="file"
			id="resource_file"
			onchange={handleFileChange}
			class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
			disabled={isSubmitting}
			aria-describedby="file-info"
		/>
		<div id="file-info" class="mt-1 text-xs text-gray-600">
			{#if selectedFile}
				<span>Selected: {selectedFile.name}</span>
			{:else if resource && resource.resource_file_url}
				<span>
					Current file: <a
						href={resource.resource_file_url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-blue-600 hover:underline">View/Download</a
					>. Leave empty to keep it.
				</span>
			{/if}
		</div>
	</div>

	<div class="flex justify-end space-x-3 border-t border-gray-200 pt-4">
		<button
			type="button"
			onclick={onclose}
			disabled={isSubmitting}
			class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			Cancel
		</button>
		<button
			type="submit"
			disabled={isSubmitting || !formData.title.trim()}
			class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isSubmitting}
				<svg
					class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Processing...
			{:else}
				{resource ? 'Save Changes' : 'Create Resource'}
			{/if}
		</button>
	</div>
</form>
