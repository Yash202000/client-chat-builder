const CACHE_NAME = 'heygenally-v2';
const STATIC_ASSETS = ['/', '/dashboard'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests; skip API calls
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;

  // Never cache Vite dev server assets — pre-bundled dep chunks carry a
  // session-scoped ?v=HASH that changes every `vite dev` restart.  Caching
  // them causes a second React instance on the next session (old cached chunk
  // uses React A, new session code uses React B → hooks crash).
  const url = e.request.url;
  if (
    url.includes('/.vite/') ||
    url.includes('/node_modules/.vite/') ||
    url.includes('@vite/') ||
    url.includes('@fs/') ||
    /\?v=[0-9a-f]{8,}/.test(url)
  ) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        // 206 Partial Content (range requests) cannot be stored in Cache API
        if (res.ok && res.status !== 206 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
