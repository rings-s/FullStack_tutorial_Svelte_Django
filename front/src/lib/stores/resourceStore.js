import {
	fetchResources as apiFetchResources,
	createResource as apiCreateResource,
	updateResource as apiUpdateResource,
	deleteResource as apiDeleteResource,
	uploadResourceImage as apiUploadImage,
	deleteResourceImage as apiDeleteImage
} from '$lib/services/api'; // Import API service functions

// --- Svelte 5 State Management using Runes ---

// $state for reactive primitive or object
let resources = $state([]); // Holds the list of resources
let isLoading = $state(false); // Tracks loading state for fetching resources
let error = $state(null); // Holds any API error message

// $derived for computed state based on other reactive variables
let resourceCount = $derived(resources.length);

// --- Store Actions ---

/**
 * Fetches resources from the backend API and updates the store state.
 */
async function fetchResources() {
	isLoading = true;
	error = null;
	try {
		const data = await apiFetchResources();
		// Sort resources, e.g., by creation date descending
		resources = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	} catch (err) {
		console.error('Failed to fetch resources:', err);
		error = err.data?.message || err.message || 'Failed to load resources.';
		resources = []; // Clear resources on error
	} finally {
		isLoading = false;
	}
}

/**
 * Adds a new resource via the API and updates the store.
 * @param {object} resourceData - { title, description, tags }
 * @param {File|null} file - Optional file to upload.
 */
async function addResource(resourceData, file = null) {
	isLoading = true; // Indicate loading for the add operation
	error = null;
	try {
		const newResource = await apiCreateResource(resourceData, file);
		// Add the new resource to the beginning of the list (or sort again)
		resources = [newResource, ...resources];
	} catch (err) {
		console.error('Failed to add resource:', err);
		error = err.data?.detail || err.data?.message || err.message || 'Failed to add resource.';
		// Re-throw the error if the component needs to react to the specific failure
		throw err;
	} finally {
		isLoading = false;
	}
}

/**
 * Updates an existing resource in the store and via the API.
 * @param {number|string} id - ID of the resource to update.
 * @param {object} updatedData - Fields to update { title?, description?, tags? }
 * @param {File|null|undefined} file - Optional new file.
 */
async function updateResource(id, updatedData, file = undefined) {
	isLoading = true; // Indicate loading for the update operation
	error = null;
	try {
		const updatedResource = await apiUpdateResource(id, updatedData, file);
		// Find the index of the resource and replace it
		const index = resources.findIndex((r) => r.id === id);
		if (index !== -1) {
			// Create a new array with the updated resource
			const newResources = [...resources];
			newResources[index] = updatedResource;
			resources = newResources;
		}
	} catch (err) {
		console.error('Failed to update resource:', err);
		error = err.data?.detail || err.data?.message || err.message || 'Failed to update resource.';
		throw err; // Re-throw for component handling
	} finally {
		isLoading = false;
	}
}

/**
 * Deletes a resource from the store and via the API.
 * @param {number|string} id - ID of the resource to delete.
 */
async function removeResource(id) {
	isLoading = true; // Indicate loading for the delete operation
	error = null;
	try {
		await apiDeleteResource(id);
		// Filter out the deleted resource from the list
		resources = resources.filter((r) => r.id !== id);
	} catch (err) {
		console.error('Failed to delete resource:', err);
		error = err.data?.message || err.message || 'Failed to delete resource.';
		throw err; // Re-throw for component handling
	} finally {
		isLoading = false;
	}
}

/**
 * Uploads an image for a resource and updates that resource in the store.
 * @param {number|string} resourceId
 * @param {File} imageFile
 * @param {string} [caption='']
 */
async function addResourceImage(resourceId, imageFile, caption = '') {
	// We might want a specific loading state for image uploads per resource
	// For simplicity here, we'll just log errors.
	error = null;
	try {
		const newImage = await apiUploadImage(resourceId, imageFile, caption);
		// Find the resource and add the new image to its 'images' array
		const index = resources.findIndex((r) => r.id === resourceId);
		if (index !== -1) {
			const updatedResource = { ...resources[index] };
			// Ensure the images array exists
			if (!updatedResource.images) {
				updatedResource.images = [];
			}
			updatedResource.images = [...updatedResource.images, newImage];

			// Update the main resources array
			const newResources = [...resources];
			newResources[index] = updatedResource;
			resources = newResources;
		}
	} catch (err) {
		console.error(`Failed to upload image for resource ${resourceId}:`, err);
		error = err.data?.message || err.message || 'Failed to upload image.';
		// Potentially display this error more specifically in the UI
	}
}

/**
 * Deletes an image associated with a resource and updates the store.
 * @param {number|string} resourceId - ID of the parent resource.
 * @param {number|string} imageId - ID of the image to delete.
 */
async function removeResourceImage(resourceId, imageId) {
	error = null;
	try {
		await apiDeleteImage(imageId);
		// Find the resource and remove the image from its 'images' array
		const resourceIndex = resources.findIndex((r) => r.id === resourceId);
		if (resourceIndex !== -1) {
			const updatedResource = { ...resources[resourceIndex] };
			if (updatedResource.images) {
				updatedResource.images = updatedResource.images.filter((img) => img.id !== imageId);

				// Update the main resources array
				const newResources = [...resources];
				newResources[resourceIndex] = updatedResource;
				resources = newResources;
			}
		}
	} catch (err) {
		console.error(`Failed to delete image ${imageId}:`, err);
		error = err.data?.message || err.message || 'Failed to delete image.';
		// Potentially display this error more specifically in the UI
	}
}

// --- Export Store State and Actions ---
// We export the reactive variables directly for use in components,
// along with the functions to modify the state.
export const resourceStore = {
	// Reactive state (read-only view for components)
	get resources() {
		return resources;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get resourceCount() {
		return resourceCount;
	},

	// Actions (functions to interact with the store/API)
	fetchResources,
	addResource,
	updateResource,
	removeResource,
	addResourceImage,
	removeResourceImage,

	// Function to get a specific resource by ID from the current state
	getResourceById: (id) => resources.find((r) => r.id === id)
};

/*
    --- Store Explanation & Tips ---

    What is this Store?
    This Svelte store (`resourceStore.js`) acts as a centralized place to manage the state
    related to 'Learning Resources' in your application. It holds the list of resources,
    tracks whether data is currently being loaded from the backend, and stores any errors
    that occur during API interactions.

    How does it work with Svelte 5 Runes?
    - `$state()`: Creates reactive variables (`resources`, `isLoading`, `error`). When these
      variables change, any part of your UI that uses them will automatically update.
    - `$derived()`: Creates a computed value (`resourceCount`) based on other reactive state.
      It automatically recalculates when `resources` changes.

    Interaction with Django Backend API:
    1. API Service (`api.js`): The store doesn't directly make `fetch` calls. It uses the
       functions imported from `$lib/services/api.js` (like `apiFetchResources`, `apiCreateResource`).
       This keeps the store focused on state management and the service focused on communication details.
    2. Fetching Data (GET): `fetchResources()` calls `apiFetchResources()`. On success, it updates
       the `$state` variable `resources` with the data received from Django. It also sets `isLoading`
       to `false` and clears any previous `error`. On failure, it sets the `error` message.
    3. Creating Data (POST): `addResource()` calls `apiCreateResource()`, sending the new resource data
       (and potentially a file using FormData) to the Django backend. If the API call is successful
       and returns the newly created resource object, the store adds this object to the local `resources`
       list, making it instantly visible in the UI.
    4. Updating Data (PUT/PATCH): `updateResource()` calls `apiUpdateResource()`, sending the ID and
       updated data (potentially including a file in FormData) to the backend. On success, it finds
       the corresponding resource in the local `resources` list and replaces it with the updated object
       returned by the API.
    5. Deleting Data (DELETE): `removeResource()` calls `apiDeleteResource()` with the resource ID.
       On success (typically a 204 No Content response), it removes the resource from the local
       `resources` list by filtering the array.

    Handling Images and Files:
    - Files (like `resource_file`) and Images (`ResourceImage` model) are sent from the frontend
      to the backend using the `FormData` object. This is crucial because it allows sending
      `multipart/form-data` requests, which is the standard way to upload files via HTTP.
    - The `api.js` service automatically handles setting up `FormData` when a file argument is provided
      to functions like `createResource`, `updateResource`, or `uploadResourceImage`.
    - The Django backend uses `MultiPartParser` and `FormParser` in its `APIView`s to correctly
      parse these `multipart/form-data` requests and access the uploaded files (`request.FILES`)
      and other form fields (`request.data`).
    - The relational `ResourceImage` model allows associating multiple images with a single `Resource`.
      The store provides `addResourceImage` and `removeResourceImage` actions that interact with the
      dedicated image upload/delete endpoints in the Django API and update the nested `images` array
      within the corresponding resource object in the local state.

    Authentication (If Added):
    - If you implement token authentication (e.g., JWT or DRF Tokens), the `api.js` service is where
      you would add the logic to include the `Authorization` header in requests (see comments in `api.js`).
    - The token would typically be obtained after a login process and stored securely (e.g., localStorage
      or an auth-specific store). The `apiFetch` helper function would retrieve the token and add the
      header to outgoing requests that require authentication. The store itself doesn't need to know
      about the token, it just relies on the `api.js` service to handle authenticated communication.

    Tips:
    - Keep Stores Focused: Each store should manage a specific 'slice' of your application's state
      (e.g., resources, user session, UI settings). Avoid creating one massive store.
    - Use Services for API Logic: Separating API calls into a service (`api.js`) makes the store
      cleaner and the API logic reusable.
    - Handle Loading and Errors: Always provide feedback to the user by tracking loading states
      (`isLoading`) and displaying meaningful error messages (`error`).
    - Immutability: When updating arrays or objects in the store (like adding or updating a resource),
      create *new* arrays or objects instead of modifying them directly (e.g., using `[...resources]`
      or `{...resource}`). This ensures Svelte's reactivity works reliably. Svelte 5 runes handle
      this more implicitly, but it's still good practice.
*/
