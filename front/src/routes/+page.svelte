<script>
	import { resourceStore } from '$lib/stores/resourceStore.js';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import ResourceForm from '$lib/components/ResourceForm.svelte';
	import { debounce, formatDate } from '$lib/utils/helpers.js'; // Assuming formatDate is useful

	// --- State ---
	let showForm = $state(false); // Controls visibility of the add/edit form
	let editingResource = $state(null); // Holds the resource object being edited, null if adding
	let searchTerm = $state(''); // Input for searching titles/descriptions
	let selectedTags = $state([]); // Array of tags to filter by

	// --- Reactive Store Data ---
	// Access reactive state from the store using getters
	let resources = $derived(resourceStore.resources);
	let isLoading = $derived(resourceStore.isLoading);
	// Error is handled by the Notification component globally

	// --- Filtering Logic ---
	// Derived state for filtered resources based on search term and selected tags
	let filteredResources = $derived(() => {
		let items = resources;

		// Filter by search term (case-insensitive)
		if (searchTerm.trim()) {
			const lowerSearchTerm = searchTerm.toLowerCase();
			items = items.filter(
				(r) =>
					r.title.toLowerCase().includes(lowerSearchTerm) ||
					(r.description && r.description.toLowerCase().includes(lowerSearchTerm))
			);
		}

		// Filter by selected tags (must contain ALL selected tags)
		if (selectedTags.length > 0) {
			items = items.filter((r) => {
				const resourceTags = r.tags_list || []; // Use the pre-processed list from serializer
				return selectedTags.every((tag) => resourceTags.includes(tag));
			});
		}

		return items;
	});

	// --- Tag Aggregation ---
	// Derived state to get all unique tags from all resources for filtering UI
	let allTags = $derived(() => {
		const tagSet = new Set();
		resources.forEach((r) => {
			(r.tags_list || []).forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).sort(); // Return sorted array of unique tags
	});

	// --- Lifecycle and Data Fetching ---
	// Use $effect.pre to run code before the component mounts (or on first render)
	$effect.pre(() => {
		// Fetch initial data if resources haven't been loaded yet
		// This check prevents re-fetching on every navigation if store already has data
		// Adjust logic if you always want to re-fetch on page load
		if (resourceStore.resources.length === 0) {
			console.log('Fetching initial resources...');
			resourceStore.fetchResources();
		}
	});

	// --- Event Handlers ---
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
			onclick={handleAddClick}
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
				oninput={handleSearchInput}
				bind:value={searchTerm}
			/>
		</div>

		<div class="md:col-span-2">
			<label class="mb-1 block text-sm font-medium text-gray-700">Filter by Tags</label>
			{#if allTags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each allTags as tag}
						<button
							onclick={() => toggleTag(tag)}
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
		{#if isLoading && resources.length === 0}
			<p class="text-center text-gray-500">Loading resources...</p>
		{:else if !isLoading && filteredResources.length === 0 && resources.length > 0}
			<p class="text-center text-gray-500">
				No resources match your current search/filter criteria.
			</p>
		{:else if !isLoading && resources.length === 0 && !resourceStore.error}
			<p class="text-center text-gray-500">
				No resources found. Click "Add New Resource" to get started.
			</p>
		{:else if resourceStore.error && resources.length === 0}
			<p class="text-center text-red-600">Error loading resources. Please try again later.</p>
		{:else}
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
