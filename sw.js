const CACHE_NAME = 'sales-app-v7-gh-pages';
const ICON_URL = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%234F008C'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-family='sans-serif' font-weight='900' font-size='110' fill='%23ffffff' style='text-shadow: 4px 4px 0px %232d0050, 8px 8px 0px %2322003d;'%3Eالمبيعات%3C/text%3E%3C/svg%3E";

const urlsToCache = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // 1. Ignore Google Scripts API (Always go network)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // 2. SPA Navigation Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // 3. Standard Caching Strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        const fetchPromise = fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !networkResponse.url.startsWith('http')) {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          }
        ).catch(() => {});

        return response || fetchPromise;
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});