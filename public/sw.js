const CACHE = 'calendar-v2'

// Activate a new service worker as soon as it's installed.
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Take control of open pages immediately and drop old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle same-origin GETs. Let Supabase API calls, POSTs, etc. pass through untouched.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return
  }

  // Page navigations: network-first so a fresh deploy shows on the next open,
  // falling back to cache when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Other same-origin assets (Vite output is content-hashed): serve from cache
  // for speed, and refresh the cache in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => cached)
      return cached || fetched
    })
  )
})
