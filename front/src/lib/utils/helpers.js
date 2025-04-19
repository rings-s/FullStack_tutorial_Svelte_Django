// frontend/src/lib/utils/helpers.js

/**
 * Example utility function: Format date string
 * @param {string | Date} dateInput - Date string or object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(
	dateInput,
	options = { year: 'numeric', month: 'long', day: 'numeric' }
) {
	try {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}
		return new Intl.DateTimeFormat('en-US', options).format(date);
	} catch (e) {
		console.error('Error formatting date:', e);
		return String(dateInput); // Fallback
	}
}

// Add other general utility functions here as needed...
// For example, a function to debounce input for search:
/**
 * Debounce function execution
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}
