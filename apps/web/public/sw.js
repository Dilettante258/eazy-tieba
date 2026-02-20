const CACHE_VERSION = "v1";
const STATIC_CACHE = `eztb-static-${CACHE_VERSION}`;
const APP_SHELL = [
	"/",
	"/index.html",
	"/manifest.webmanifest",
	"/favicon.ico",
	"/favicon192.png",
	"/favicon512.png",
	"/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => cache.addAll(APP_SHELL))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith("eztb-static-") && key !== STATIC_CACHE)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		const cache = await caches.open(STATIC_CACHE);
		cache.put(request, response.clone());
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		return caches.match("/index.html");
	}
}

async function staleWhileRevalidate(request) {
	const cached = await caches.match(request);
	const networkPromise = fetch(request)
		.then(async (response) => {
			const cache = await caches.open(STATIC_CACHE);
			cache.put(request, response.clone());
			return response;
		})
		.catch(() => null);

	if (cached) return cached;
	return (await networkPromise) || caches.match("/index.html");
}

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request));
		return;
	}

	event.respondWith(staleWhileRevalidate(request));
});
