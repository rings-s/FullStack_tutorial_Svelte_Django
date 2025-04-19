<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';

	// --- Props ---
	export let resourceId; // The ID of the parent resource.

	// --- State ---
	// Holds the File object selected by the user for the image upload.
	let selectedImageFile = $state(null);
	// Holds the optional caption text entered by the user.
	let caption = $state('');
	// Tracks if the image is currently uploading to the API.
	let isUploading = $state(false);
	// Stores any error message specific to this image upload attempt.
	let uploadError = $state(null);

	// --- Event Handlers ---
	/**
	 * Handles changes to the image file input field.
	 * Updates the `selectedImageFile` state.
	 * @param {Event} event - The input change event.
	 */
	function handleImageFileChange(event) {
		const files = event.target.files;
		if (files && files.length > 0) {
			selectedImageFile = files[0];
			uploadError = null; // Clear previous error on new file selection
		} else {
			selectedImageFile = null;
		}
	}

	/**
	 * Handles the image upload submission.
	 * Validates that a file is selected and resourceId is present.
	 * Calls the `addResourceImage` action in the store.
	 * Manages loading state and displays errors locally.
	 */
	async function handleImageUpload() {
		// Basic validation
		if (!selectedImageFile) {
			uploadError = 'Please select an image file to upload.';
			return;
		}
		if (!resourceId) {
			// This should ideally not happen if the component is used correctly,
			// but good to have a safeguard.
			uploadError = 'Cannot upload image: Resource ID is missing.';
			console.error('ImageUploader: resourceId prop is missing.');
			return;
		}

		isUploading = true;
		uploadError = null; // Clear previous errors

		try {
			// Call the store action, passing resource ID, the File object, and the caption.
			await resourceStore.addResourceImage(resourceId, selectedImageFile, caption);
			console.log(`Image uploaded successfully for resource ${resourceId}`);

			// Reset the form fields after successful upload.
			selectedImageFile = null;
			caption = '';
			// Reset the file input element visually
			const fileInput = document.getElementById(`image-file-${resourceId}`);
			if (fileInput) {
				fileInput.value = '';
			}

			// Optionally, provide feedback or close the uploader via a callback prop if needed.
			// Example: if (onUploadSuccess) onUploadSuccess();

		} catch (err) {
			// Handle errors from the API call.
			console.error(`Image upload failed for resource ${resourceId}:`, err);
			uploadError = err.data?.message || err.message || 'Failed to upload image. Please try again.';
			// The global Notification component will also display the error via the store state.
		} finally {
			// Ensure loading state is turned off.
			isUploading = false;
		}
	}
</script>

<div class="mt-2 space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
	<h5 class="text-sm font-medium text-gray-800">Upload New Image</h5>

	{#if uploadError}
		<p class="text-xs text-red-600">{uploadError}</p>
	{/if}

	<div>
		<label for="image-file-{resourceId}" class="block text-xs font-medium text-gray-700"
			>Image File *</label
		>
		<input
			type="file"
			# Use resourceId to create a unique ID if multiple uploaders could exist on a page
			id="image-file-{resourceId}"
			accept="image/*" # Suggest browser filter for image types
			required
			onchange={handleImageFileChange}
			class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:py-1 file:px-3 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isUploading}
			aria-describedby="image-file-status-{resourceId}"
		/>
		<div id="image-file-status-{resourceId}" class="mt-1 text-xs text-gray-600">
			{#if selectedImageFile}
				<span>Selected: {selectedImageFile.name}</span>
			{/if}
		</div>
	</div>

	<div>
		<label for="caption-{resourceId}" class="block text-xs font-medium text-gray-700"
			>Caption (Optional)</label
		>
		<input
			type="text"
			id="caption-{resourceId}"
			bind:value={caption}
			placeholder="Optional image caption"
			class="mt-1 block w-full rounded-md border-gray-300 px-2 py-1 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs disabled:cursor-not-allowed disabled:bg-gray-50"
			disabled={isUploading}
		/>
	</div>

	<div class="text-right">
		<button
			type="button"
			onclick={handleImageUpload}
			disabled={isUploading || !selectedImageFile} class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isUploading}
				<svg class="-ml-0.5 mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
				Uploading...
			{:else}
				Upload Image
			{/if}
		</button>
	</div>
</div>
