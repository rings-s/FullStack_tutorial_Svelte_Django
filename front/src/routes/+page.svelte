<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import ResourceForm from '$lib/components/ResourceForm.svelte';
	import { debounce, formatDate } from '$lib/utils/helpers.js';
	import { onMount } from 'svelte';

	// Local state
	let showForm = false;
	let editingResource = null;
	let searchTerm = '';
	let selectedTags = [];

	// Store data with default values
	let resources = [];
	let isLoading = false;

	// Subscribe to store values
	resourceStore.subscribe((value) => (resources = value || []));
	resourceStore.isLoading.subscribe((value) => (isLoading = value));

	// Computed property for filtered resources
	$: filteredResources = getFilteredResources(resources, searchTerm, selectedTags);

	// Computed property for all unique tags
	$: allTags = getAllTags(resources);

	// Functions to compute derived values
	function getFilteredResources(resourceList, term, tags) {
		if (!resourceList || !Array.isArray(resourceList)) return [];

		let items = resourceList;

		// Filter by search term (case-insensitive)
		if (term && term.trim()) {
			const lowerSearchTerm = term.toLowerCase();
			items = items.filter(
				(r) =>
					(r.title && r.title.toLowerCase().includes(lowerSearchTerm)) ||
					(r.description && r.description.toLowerCase().includes(lowerSearchTerm))
			);
		}

		// Filter by selected tags (must contain ALL selected tags)
		if (tags && tags.length > 0) {
			items = items.filter((r) => {
				const resourceTags = r.tags_list || []; // Use the pre-processed list from serializer
				return tags.every((tag) => resourceTags.includes(tag));
			});
		}

		return items;
	}

	function getAllTags(resourceList) {
		if (!resourceList || !Array.isArray(resourceList)) return [];

		const tagSet = new Set();
		resourceList.forEach((r) => {
			if (r.tags_list && Array.isArray(r.tags_list)) {
				r.tags_list.forEach((tag) => tagSet.add(tag));
			}
		});
		return Array.from(tagSet).sort(); // Return sorted array of unique tags
	}

	// Fetch resources on component mount
	onMount(() => {
		resourceStore.fetchResources();
	});

	// Event Handlers
	function handleAddClick() {
		editingResource = null; // Ensure we are in 'add' mode
		showForm = true; // Show the form
	}

	function handleEditClick(resource) {
		editingResource = resource; // Set the resource to edit
		showForm = true; // Show the form
	}

	async function handleDeleteClick(resourceId) {
		// Optional: Add a confirmation dialog
		if (confirm('Are you sure you want to delete this resource?')) {
			try {
				await resourceStore.removeResource(resourceId);
				// Optionally show a success message (could use another store or local state)
				console.log('Resource deleted successfully');
			} catch (err) {
				// Error is handled globally by Notification component
				console.error('Deletion failed:', err);
			}
		}
	}

	function handleFormClose() {
		showForm = false;
		editingResource = null; // Clear editing state
	}

	// Debounced search input handler
	const debouncedSearch = debounce((event) => {
		searchTerm = event.target.value;
	}, 300); // 300ms delay

	function handleSearchInput(event) {
		debouncedSearch(event);
	}

	// Tag selection handler
	function toggleTag(tag) {
		const index = selectedTags.indexOf(tag);
		if (index > -1) {
			// Remove tag if already selected
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			// Add tag if not selected
			selectedTags = [...selectedTags, tag];
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<h2 class="text-2xl font-bold text-gray-800">Learning Resources</h2>
		<button
			on:click={handleAddClick}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			+ Add New Resource
		</button>
	</div>

	<div class="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-3">
		<div class="md:col-span-1">
			<label for="search" class="mb-1 block text-sm font-medium text-gray-700">Search</label>
			<input
				type="search"
				id="search"
				placeholder="Search by title or description..."
				class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
				on:input={handleSearchInput}
				value={searchTerm}
			/>
		</div>

		<div class="md:col-span-2">
			<label class="mb-1 block text-sm font-medium text-gray-700">Filter by Tags</label>
			{#if allTags && allTags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each allTags as tag}
						<button
							on:click={() => toggleTag(tag)}
							class="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ease-in-out
                            {selectedTags.includes(tag)
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
						>
							{tag}
						</button>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500">No tags available to filter.</p>
			{/if}
		</div>
	</div>

	{#if showForm}
		<div class="rounded-lg bg-white p-4 shadow md:p-6">
			<ResourceForm resource={editingResource} onclose={handleFormClose} />
		</div>
	{/if}

	<div class="space-y-4">
		{#if isLoading && (!resources || resources.length === 0)}
			<p class="text-center text-gray-500">Loading resources...</p>
		{:else if !isLoading && filteredResources && filteredResources.length === 0 && resources && resources.length > 0}
			<p class="text-center text-gray-500">
				No resources match your current search/filter criteria.
			</p>
		{:else if !isLoading && (!resources || resources.length === 0)}
			<p class="text-center text-gray-500">
				No resources found. Click "Add New Resource" to get started.
			</p>
		{:else if filteredResources && filteredResources.length > 0}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredResources as resource (resource.id)}
					<ResourceCard {resource} onedit={handleEditClick} ondelete={handleDeleteClick} />
				{/each}
			</div>
			{#if isLoading}
				<p class="text-center text-sm text-gray-500">Processing...</p>
			{/if}
		{/if}
	</div>
</div>
