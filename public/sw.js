const CACHE_NAME = 'timewarp-cache-v3';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const assetsToCache = [
    scope,
    `${scope}index.html`,
    `${scope}hourglass.svg`,
    `${scope}icon-192.png`,
    `${scope}icon-512.png`,
    `${scope}manifest.json`
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match(`${self.registration.scope}index.html`))
      );
    })
  );
});
