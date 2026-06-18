const CACHE = 'calendar-v1'

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        const clone = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})
