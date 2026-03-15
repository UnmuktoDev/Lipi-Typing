const CACHE_NAME = 'lipi-typing-unmukto';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './src/script.js',
    './src/style.css',
    './src/unijoyKey.css',
    './src/keyboardMapper.js',
    './src/custom.js',
    './public/lipi_dataset.json'
];

// Install event: pre-cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const asset of ASSETS_TO_CACHE) {
                try {
                    const response = await fetch(asset);
                    if (!response.ok) throw new Error(response.status);
                    await cache.put(asset, response.clone());
                    console.log('Cached:', asset);
                } catch (err) {
                    console.warn('Failed to cache:', asset, err);
                }
            }
        })
    );
    self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch event: serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Always fetch this specific file from network
    if (url.includes('public/update.json')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request)
                .then((networkResponse) => {
                    // Only cache GET requests to avoid errors
                    if (event.request.method === 'GET') {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                });
        })
    );
});
