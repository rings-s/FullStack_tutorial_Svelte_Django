// File: /src/lib/stores/resourceStore.js

import { writable, derived } from 'svelte/store';
import {
	fetchResources as apiFetchResources,
	createResource as apiCreateResource,
	updateResource as apiUpdateResource,
	deleteResource as apiDeleteResource,
	uploadResourceImage as apiUploadImage,
	deleteResourceImage as apiDeleteImage
} from '$lib/services/api';

// Create the base stores
const _resources = writable([]);
const _isLoading = writable(false);
const _error = writable(null);

// Create derived store for resource count
const resourceCount = derived(_resources, ($resources) => $resources.length);

// Create the store interface
function createResourceStore() {
	// Helper function to access store value
	const getStoreValue = (store) => {
		let value;
		store.subscribe(($) => (value = $))();
		return value;
	};

	return {
		// Subscribe methods for reactive access in components
		subscribe: _resources.subscribe,
		isLoading: { subscribe: _isLoading.subscribe },
		error: { subscribe: _error.subscribe },
		resourceCount: { subscribe: resourceCount.subscribe },

		// Action: Fetch all resources
		fetchResources: async () => {
			_isLoading.set(true);
			_error.set(null);
			try {
				const data = await apiFetchResources();
				_resources.set(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
			} catch (err) {
				console.error('Failed to fetch resources:', err);
				_error.set(err.data?.message || err.message || 'Failed to load resources.');
				_resources.set([]);
			} finally {
				_isLoading.set(false);
			}
		},

		// Action: Add a new resource
		addResource: async (resourceData, file = null) => {
			_isLoading.set(true);
			_error.set(null);
			try {
				const newResource = await apiCreateResource(resourceData, file);
				_resources.update((items) => [newResource, ...items]);
				return newResource;
			} catch (err) {
				console.error('Failed to add resource:', err);
				_error.set(
					err.data?.detail || err.data?.message || err.message || 'Failed to add resource.'
				);
				throw err;
			} finally {
				_isLoading.set(false);
			}
		},

		// Action: Update existing resource
		updateResource: async (id, updatedData, file = undefined) => {
			_isLoading.set(true);
			_error.set(null);
			try {
				const updatedResource = await apiUpdateResource(id, updatedData, file);
				_resources.update((items) => {
					const index = items.findIndex((r) => r.id === id);
					if (index !== -1) {
						const newItems = [...items];
						newItems[index] = updatedResource;
						return newItems;
					}
					return items;
				});
				return updatedResource;
			} catch (err) {
				console.error('Failed to update resource:', err);
				_error.set(
					err.data?.detail || err.data?.message || err.message || 'Failed to update resource.'
				);
				throw err;
			} finally {
				_isLoading.set(false);
			}
		},

		// Action: Remove a resource
		removeResource: async (id) => {
			_isLoading.set(true);
			_error.set(null);
			try {
				await apiDeleteResource(id);
				_resources.update((items) => items.filter((r) => r.id !== id));
			} catch (err) {
				console.error('Failed to delete resource:', err);
				_error.set(err.data?.message || err.message || 'Failed to delete resource.');
				throw err;
			} finally {
				_isLoading.set(false);
			}
		},

		// Action: Add image to a resource
		addResourceImage: async (resourceId, imageFile, caption = '') => {
			_error.set(null);
			try {
				const newImage = await apiUploadImage(resourceId, imageFile, caption);
				_resources.update((items) => {
					const index = items.findIndex((r) => r.id === resourceId);
					if (index !== -1) {
						const updatedResource = { ...items[index] };
						if (!updatedResource.images) {
							updatedResource.images = [];
						}
						updatedResource.images = [...updatedResource.images, newImage];

						const newItems = [...items];
						newItems[index] = updatedResource;
						return newItems;
					}
					return items;
				});
				return newImage;
			} catch (err) {
				console.error(`Failed to upload image for resource ${resourceId}:`, err);
				_error.set(err.data?.message || err.message || 'Failed to upload image.');
				throw err;
			}
		},

		// Action: Remove image from a resource
		removeResourceImage: async (resourceId, imageId) => {
			_error.set(null);
			try {
				await apiDeleteImage(imageId);
				_resources.update((items) => {
					const resourceIndex = items.findIndex((r) => r.id === resourceId);
					if (resourceIndex !== -1 && items[resourceIndex].images) {
						const updatedResource = { ...items[resourceIndex] };
						updatedResource.images = updatedResource.images.filter((img) => img.id !== imageId);

						const newItems = [...items];
						newItems[resourceIndex] = updatedResource;
						return newItems;
					}
					return items;
				});
			} catch (err) {
				console.error(`Failed to delete image ${imageId}:`, err);
				_error.set(err.data?.message || err.message || 'Failed to delete image.');
				throw err;
			}
		},

		// Helper function to get a resource by ID
		getResourceById: (id) => {
			const resources = getStoreValue(_resources);
			return resources.find((r) => r.id === id);
		},

		// Method to clear error
		clearError: () => _error.set(null)
	};
}

// Create and export the store
export const resourceStore = createResourceStore();
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
