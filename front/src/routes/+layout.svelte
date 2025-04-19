<script>
	import '../app.css'; // Import global styles (including Tailwind)
	import Notification from '$lib/components/Notification.svelte'; // Import notification component
	let { children } = $props();

	// Basic layout structure, you can add Navbars, Footers etc. here
</script>

<div class="min-h-screen bg-gray-100 font-sans">
	<header class="bg-blue-600 text-white shadow-md">
		<nav class="container mx-auto px-6 py-3">
			<h1 class="text-xl font-semibold">Learning Resource App</h1>
		</nav>
	</header>

	<main class="container mx-auto p-6">
		{@render children()}
	</main>

	<footer class="mt-8 bg-gray-200 py-4 text-center text-sm text-gray-600">
		© {new Date().getFullYear()} Learning App
	</footer>

	<Notification />
</div>
