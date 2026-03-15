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
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch event: serve from cache or network
self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.url.includes('public/update.json')) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(request)
                .then((networkResponse) => {
                    if (request.method === 'GET') {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    if (request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                })
        })
    );
});
