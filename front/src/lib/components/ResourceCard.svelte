<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';
	import { formatDate } from '$lib/utils/helpers.js';
	import ImageUploader from './ImageUploader.svelte'; // Component for uploading new images

	// --- Props ---
	/** @type {import('./types').Resource} */ // Optional JSDoc type hint for the resource object
	export let resource; // The resource object passed from the parent component
	export let onedit = (resource) => {}; // Edit callback, defaults to no-op
	export let ondelete = (resourceId) => {}; // Delete callback, defaults to no-op

	// --- State ---
	// Local state to control the visibility of the ImageUploader component for this card.
	let showImageUploader = $state(false);

	// --- Event Handlers ---
	/**
	 * Handles the click event for the 'Edit' button.
	 * Calls the 'onedit' prop function passed from the parent, providing the resource data.
	 */
	function handleEdit() {
		onedit(resource);
	}

	/**
	 * Handles the click event for the 'Delete' button for the entire resource.
	 * Calls the 'ondelete' prop function passed from the parent, providing the resource ID.
	 */
	function handleDeleteResource() {
		ondelete(resource.id);
	}

	/**
	 * Handles the click event for deleting a specific image associated with this resource.
	 * Prompts for confirmation before proceeding.
	 * Calls the `removeResourceImage` action from the store directly.
	 * @param {number|string} imageId - The ID of the image to be deleted.
	 */
	async function handleImageDelete(imageId) {
		// Simple browser confirmation dialog
		if (confirm('Are you sure you want to delete this image?')) {
			try {
				// Directly call the store action to delete the image via API and update state
				await resourceStore.removeResourceImage(resource.id, imageId);
				console.log(`Image ${imageId} deleted successfully for resource ${resource.id}`);
				// Success feedback can be enhanced (e.g., temporary message on card)
			} catch (err) {
				console.error(`Failed to delete image ${imageId}:`, err);
				// Error display is handled globally by the Notification component via the store's error state.
			}
		}
	}
</script>

<div
	class="overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-md"
>
	<div class="p-5">
		<h3 class="mb-2 text-lg font-semibold text-gray-900">{resource.title}</h3>

		{#if resource.description}
			<p class="mb-3 text-sm text-gray-600">{resource.description}</p>
		{/if}

		{#if resource.tags_list && resource.tags_list.length > 0}
			<div class="mb-3 flex flex-wrap gap-2">
				{#each resource.tags_list as tag}
					<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		{#if resource.resource_file_url}
			<div class="mb-3">
				<a
					href={resource.resource_file_url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-blue-600 hover:underline"
					title="Download the file attached to this resource"
				>
					Download Attached File
				</a>
			</div>
		{/if}

		{#if resource.images && resource.images.length > 0}
			<div class="mb-3 space-y-2">
				<h4 class="text-sm font-medium text-gray-700">Images:</h4>
				<div class="grid grid-cols-3 gap-2">
					{#each resource.images as img (img.id)}
						<div class="group relative">
							<img
								src={img.image_url}
								alt={img.caption || `Image for ${resource.title}`}
								class="h-20 w-full rounded object-cover"
								loading="lazy"
								onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
							/>
							<div
								class="hidden h-20 w-full items-center justify-center rounded bg-gray-200 text-center text-xs text-gray-500"
								aria-hidden="true"
							>
								Image not available
							</div>
							{#if img.caption}
								<p class="mt-1 truncate text-xs text-gray-500" title={img.caption}>{img.caption}</p>
							{/if}
							<button
								onclick={() => handleImageDelete(img.id)}
								class="absolute top-1 right-1 z-10 hidden rounded-full bg-red-500 p-1 text-white opacity-80 transition-opacity group-hover:block hover:opacity-100"
								aria-label="Delete image"
								title="Delete this image"
							>
								<svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/></svg
								>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<button
			onclick={() => (showImageUploader = !showImageUploader)}
			class="mb-3 text-sm text-green-600 hover:underline"
		>
			{showImageUploader ? 'Hide Image Uploader' : 'Add New Image'}
		</button>

		{#if showImageUploader}
			<ImageUploader resourceId={resource.id} />
		{/if}

		<p class="mt-4 text-xs text-gray-400">
			Created: {formatDate(resource.created_at, { dateStyle: 'short', timeStyle: 'short' })} | Updated:
			{formatDate(resource.updated_at, { dateStyle: 'short', timeStyle: 'short' })}
		</p>
	</div>

	<div class="flex justify-end space-x-2 border-t border-gray-200 bg-gray-50 p-3">
		<button
			onclick={handleEdit}
			class="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 focus:outline-none"
			title="Edit this resource"
		>
			Edit
		</button>
		<button
			onclick={handleDeleteResource}
			class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
			title="Delete this resource"
		>
			Delete
		</button>
	</div>
</div>
