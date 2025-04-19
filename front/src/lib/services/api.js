// frontend/src/lib/services/api.js

/**
 * Service module for interacting with the Django backend API.
 */

// Base URL for the Django API. Adjust if your backend runs on a different port or domain.
const API_BASE_URL = 'http://localhost:8000/api'; // Default Django dev server

/**
 * Performs a fetch request to the API.
 * Handles common tasks like setting headers and parsing JSON response.
 *
 * @param {string} endpoint - The API endpoint (e.g., '/resources/').
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @param {boolean} isFormData - Set to true if the body is FormData (for file uploads).
 * @returns {Promise<any>} - The JSON response data or throws an error.
 */
async function apiFetch(endpoint, options = {}, isFormData = false) {
	const url = `${API_BASE_URL}${endpoint}`;
	const headers = {
		// Default headers
		...(isFormData ? {} : { 'Content-Type': 'application/json', Accept: 'application/json' }), // Don't set Content-Type for FormData, browser does it
		...options.headers // Allow overriding or adding headers
	};

	// --- Authentication Handling Explanation ---
	// If you were implementing token authentication:
	// 1. You would typically store the authentication token (e.g., JWT or DRF Token)
	//    in localStorage, sessionStorage, or potentially another Svelte store after login.
	// 2. Before making a request, you retrieve the token.
	// 3. If the token exists, you add the Authorization header.

	/* Example Authentication Logic (Commented Out):
    const token = localStorage.getItem('authToken'); // Or get from a store
    if (token) {
        headers['Authorization'] = `Token ${token}`; // Or 'Bearer ' for JWT
    }
    */

	try {
		const response = await fetch(url, {
			...options,
			headers: headers,
			// IMPORTANT: For GET requests, body should not be included.
			// Fetch API handles FormData body correctly without explicit Content-Type.
			body: options.body
		});

		// Check if the response status indicates success (e.g., 200-299)
		if (!response.ok) {
			// Try to parse error details from the response body
			let errorData;
			try {
				errorData = await response.json();
			} catch (e) {
				// If response is not JSON, use the status text
				errorData = { message: response.statusText };
			}
			// Throw an error object including status and details
			const error = new Error(`API Error: ${response.status} ${response.statusText}`);
			error.status = response.status;
			error.data = errorData; // Attach detailed error info if available
			throw error;
		}

		// If the response is 204 No Content (like DELETE), return null as there's no body
		if (response.status === 204) {
			return null;
		}

		// Otherwise, parse the JSON response body
		return await response.json();
	} catch (error) {
		console.error(`API Fetch Error (${options.method || 'GET'} ${endpoint}):`, error);
		// Re-throw the error so calling code (e.g., stores) can handle it
		throw error;
	}
}

// --- Resource Endpoints ---

/**
 * Fetches all resources.
 * Corresponds to GET /api/resources/
 * @returns {Promise<Array<object>>} - A list of resource objects.
 */
export function fetchResources() {
	return apiFetch('/resources/', { method: 'GET' });
}

/**
 * Fetches a single resource by its ID.
 * Corresponds to GET /api/resources/{id}/
 * @param {number|string} id - The ID of the resource.
 * @returns {Promise<object>} - The resource object.
 */
export function fetchResource(id) {
	return apiFetch(`/resources/${id}/`, { method: 'GET' });
}

/**
 * Creates a new resource.
 * Corresponds to POST /api/resources/
 * Handles file uploads using FormData.
 *
 * @param {object} resourceData - Data for the new resource (title, description, tags).
 * @param {File|null} file - The optional file to upload.
 * @returns {Promise<object>} - The newly created resource object.
 */
export function createResource(resourceData, file = null) {
	const formData = new FormData();
	formData.append('title', resourceData.title);
	formData.append('description', resourceData.description || '');
	formData.append('tags', resourceData.tags || ''); // Send tags as comma-separated string

	// Append the file only if it exists
	if (file) {
		formData.append('resource_file', file);
	}

	// Use apiFetch with FormData
	return apiFetch(
		'/resources/',
		{
			method: 'POST',
			body: formData
		},
		true
	); // Indicate that the body is FormData
}

/**
 * Updates an existing resource (partially using PATCH).
 * Corresponds to PATCH /api/resources/{id}/
 * Handles optional file updates using FormData.
 *
 * @param {number|string} id - The ID of the resource to update.
 * @param {object} resourceData - Data fields to update.
 * @param {File|null|undefined} file - The new file, null to keep existing, undefined to not change.
 * @returns {Promise<object>} - The updated resource object.
 */
export function updateResource(id, resourceData, file = undefined) {
	const formData = new FormData();

	// Append only the fields that are being updated
	if (resourceData.title !== undefined) formData.append('title', resourceData.title);
	if (resourceData.description !== undefined)
		formData.append('description', resourceData.description);
	if (resourceData.tags !== undefined) formData.append('tags', resourceData.tags);

	// Handle file update: Append only if a new file is provided
	// Note: To *remove* a file via PATCH might require a specific backend implementation
	// (e.g., sending `resource_file: null` or a dedicated flag).
	// Here, we only handle replacing the file or leaving it unchanged.
	if (file) {
		formData.append('resource_file', file);
	}
	// If `file` is `null` or `undefined`, we don't append it, so backend PATCH keeps the existing file.

	return apiFetch(
		`/resources/${id}/`,
		{
			method: 'PATCH', // Use PATCH for partial updates
			body: formData
		},
		true
	); // Indicate FormData
}

/**
 * Deletes a resource by its ID.
 * Corresponds to DELETE /api/resources/{id}/
 * @param {number|string} id - The ID of the resource to delete.
 * @returns {Promise<null>} - Resolves when deletion is successful.
 */
export function deleteResource(id) {
	return apiFetch(`/resources/${id}/`, { method: 'DELETE' });
}

// --- Resource Image Endpoints ---

/**
 * Uploads an image for a specific resource.
 * Corresponds to POST /api/resources/{resource_pk}/images/
 * @param {number|string} resourceId - The ID of the resource to associate the image with.
 * @param {File} imageFile - The image file to upload.
 * @param {string} [caption=''] - Optional caption for the image.
 * @returns {Promise<object>} - The newly created resource image object.
 */
export function uploadResourceImage(resourceId, imageFile, caption = '') {
	const formData = new FormData();
	formData.append('image', imageFile);
	formData.append('caption', caption);

	return apiFetch(
		`/resources/${resourceId}/images/`,
		{
			method: 'POST',
			body: formData
		},
		true
	); // Indicate FormData
}

/**
 * Deletes a specific image by its ID.
 * Corresponds to DELETE /api/images/{id}/
 * @param {number|string} imageId - The ID of the image to delete.
 * @returns {Promise<null>} - Resolves when deletion is successful.
 */
export function deleteResourceImage(imageId) {
	return apiFetch(`/images/${imageId}/`, { method: 'DELETE' });
}
