// Minimal service worker: exists mainly so the browser considers this app
// installable (a manifest alone isn't enough — Chrome/Android also require
// a registered service worker with a fetch handler).
//
// Deliberately conservative for a data-management app: API calls (/api/*)
// and any non-GET request always go straight to the network — this app
// must never show stale attendance/fee/grade data. Only the static built
// assets (JS/CSS/icons) use stale-while-revalidate, since those are safe to
// serve instantly from cache while a fresh copy loads in the background.

const SHELL_CACHE = 'sms-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const isStaticAsset =
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || /\.(png|svg|ico|webmanifest)$/.test(url.pathname));

  if (!isStaticAsset) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
