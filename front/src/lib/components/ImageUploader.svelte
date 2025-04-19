<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';

	// Props
	export let resourceId;

	// Local state
	let selectedImageFile = null;
	let caption = '';
	let isUploading = false;
	let uploadError = null;

	// Event handlers
	function handleImageFileChange(event) {
		const files = event.target.files;
		if (files && files.length > 0) {
			selectedImageFile = files[0];
			uploadError = null;
		} else {
			selectedImageFile = null;
		}
	}

	async function handleImageUpload() {
		// Basic validation
		if (!selectedImageFile) {
			uploadError = 'Please select an image file to upload.';
			return;
		}
		if (!resourceId) {
			uploadError = 'Cannot upload image: Resource ID is missing.';
			console.error('ImageUploader: resourceId prop is missing.');
			return;
		}

		isUploading = true;
		uploadError = null;

		try {
			await resourceStore.addResourceImage(resourceId, selectedImageFile, caption);
			console.log(`Image uploaded successfully for resource ${resourceId}`);

			// Reset form after success
			selectedImageFile = null;
			caption = '';
			const fileInput = document.getElementById(`image-file-${resourceId}`);
			if (fileInput) {
				fileInput.value = '';
			}
		} catch (err) {
			console.error(`Image upload failed for resource ${resourceId}:`, err);
			uploadError = err.data?.message || err.message || 'Failed to upload image. Please try again.';
		} finally {
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
			id="image-file-{resourceId}"
			accept="image/*"
			required
			on:change={handleImageFileChange}
			class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
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
			class="mt-1 block w-full rounded-md border-gray-300 px-2 py-1 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 sm:text-xs"
			disabled={isUploading}
		/>
	</div>

	<div class="text-right">
		<button
			type="button"
			on:click={handleImageUpload}
			disabled={isUploading || !selectedImageFile}
			class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isUploading}
				<svg
					class="mr-2 -ml-0.5 h-4 w-4 animate-spin"
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
				Uploading...
			{:else}
				Upload Image
			{/if}
		</button>
	</div>
</div>
