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

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {

  const url = event.request.url;

  if (url.includes('public/update.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {

      if (response) return response;

      return fetch(event.request)
        .then((fetchResponse) => {

          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });

        })
        .catch(() => {

          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }

        });

    })
  );
});