<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';
	import { formatDate } from '$lib/utils/helpers.js';
	import ImageUploader from './ImageUploader.svelte';

	// --- Props ---
	export let resource; // The resource object passed from the parent component
	export let onedit = (resource) => {}; // Edit callback, defaults to no-op
	export let ondelete = (resourceId) => {}; // Delete callback, defaults to no-op

	// --- State ---
	let showImageUploader = false;

	// Get primary image (first image in the array) and additional images
	$: primaryImage = resource.images && resource.images.length > 0 ? resource.images[0] : null;
	$: additionalImages =
		resource.images && resource.images.length > 1 ? resource.images.slice(1) : [];

	// --- Event Handlers ---
	function handleEdit() {
		onedit(resource);
	}

	function handleDeleteResource() {
		ondelete(resource.id);
	}

	async function handleImageDelete(imageId) {
		if (confirm('Are you sure you want to delete this image?')) {
			try {
				await resourceStore.removeResourceImage(resource.id, imageId);
				console.log(`Image ${imageId} deleted successfully for resource ${resource.id}`);
			} catch (err) {
				console.error(`Failed to delete image ${imageId}:`, err);
			}
		}
	}
</script>

<div
	class="overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-md"
>
	<!-- Primary Image Section (if available) -->
	{#if primaryImage}
		<div class="group relative overflow-hidden">
			<img
				src={primaryImage.image_url}
				alt={primaryImage.caption || `Primary image for ${resource.title}`}
				class="h-48 w-full object-cover"
				loading="lazy"
				on:error={(e) => {
					console.error('Primary image failed to load:', primaryImage.image_url);
					e.target.style.display = 'none';
					e.target.nextElementSibling.style.display = 'flex';
				}}
			/>

			<!-- Fallback for failed primary image -->
			<div class="hidden h-48 w-full flex-col items-center justify-center bg-gray-100">
				<svg
					class="mb-2 h-10 w-10 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
				<span class="text-sm text-gray-500">Image not available</span>
			</div>

			<!-- Enlarge primary image link -->
			<a
				href={primaryImage.image_url}
				target="_blank"
				rel="noopener noreferrer"
				class="bg-opacity-0 group-hover:bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity group-hover:opacity-100"
				title="View full size image"
			>
				<span class="bg-opacity-75 rounded bg-white px-2 py-1 text-xs font-medium text-gray-800">
					View Full Size
				</span>
			</a>

			<!-- Delete button for primary image -->
			<button
				on:click={() => handleImageDelete(primaryImage.id)}
				class="absolute top-2 right-2 z-10 hidden rounded-full bg-red-500 p-1.5 text-white opacity-80 transition-opacity group-hover:block hover:opacity-100"
				aria-label="Delete image"
				title="Delete this image"
			>
				<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<!-- Primary image caption if available -->
			{#if primaryImage.caption}
				<div class="bg-opacity-50 absolute right-0 bottom-0 left-0 bg-black p-2">
					<p class="truncate text-sm text-white">{primaryImage.caption}</p>
				</div>
			{/if}
		</div>
	{/if}

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

		<!-- Display resource file link if available -->
		{#if resource.resource_file_url}
			<div class="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
				<div class="flex items-start">
					<!-- File type icon based on extension -->
					<div class="mt-0.5 mr-3">
						<svg
							class="h-6 w-6 text-gray-500"
							fill="currentColor"
							viewBox="0 0 20 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill-rule="evenodd"
								d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
								clip-rule="evenodd"
							></path>
						</svg>
					</div>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-700">Attached File</h4>
						<a
							href={resource.resource_file_url}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-1 inline-flex items-center text-sm text-blue-600 hover:underline"
						>
							<svg
								class="mr-1 h-4 w-4"
								fill="currentColor"
								viewBox="0 0 20 20"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
								></path>
							</svg>
							Download File
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Additional Images Gallery -->
		{#if additionalImages.length > 0}
			<div class="mb-4">
				<h4 class="mb-2 text-sm font-medium text-gray-700">Additional Images:</h4>
				<div class="grid grid-cols-4 gap-2">
					{#each additionalImages as img (img.id)}
						<div class="group relative">
							<img
								src={img.image_url}
								alt={img.caption || `Additional image for ${resource.title}`}
								class="h-16 w-full rounded object-cover"
								loading="lazy"
								on:error={(e) => {
									console.error('Image failed to load:', img.image_url);
									e.target.style.display = 'none';
									e.target.nextElementSibling.style.display = 'flex';
								}}
							/>

							<!-- Fallback for failed thumbnail -->
							<div
								class="hidden h-16 w-full flex-col items-center justify-center rounded bg-gray-100"
							>
								<svg
									class="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									></path>
								</svg>
							</div>

							<!-- Enlarge image link for thumbnails -->
							<a
								href={img.image_url}
								target="_blank"
								rel="noopener noreferrer"
								class="bg-opacity-0 group-hover:bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity group-hover:opacity-100"
								title={img.caption || 'View full size image'}
							>
								<span class="sr-only">View full size</span>
								<svg
									class="h-4 w-4 text-white"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
									></path>
									<path
										d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"
									></path>
								</svg>
							</a>

							<!-- Delete button for thumbnail -->
							<button
								on:click={() => handleImageDelete(img.id)}
								class="absolute top-0.5 right-0.5 z-10 hidden rounded-full bg-red-500 p-0.5 text-white opacity-80 transition-opacity group-hover:block hover:opacity-100"
								aria-label="Delete image"
								title="Delete this image"
							>
								<svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Add New Image Button -->
		<button
			on:click={() => (showImageUploader = !showImageUploader)}
			class="mb-3 flex items-center text-sm text-green-600 hover:underline"
		>
			<svg
				class="mr-1 h-4 w-4"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
					clip-rule="evenodd"
				></path>
			</svg>
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
			on:click={handleEdit}
			class="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 focus:outline-none"
			title="Edit this resource"
		>
			Edit
		</button>
		<button
			on:click={handleDeleteResource}
			class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
			title="Delete this resource"
		>
			Delete
		</button>
	</div>
</div>
