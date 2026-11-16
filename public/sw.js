/* DSChat service worker: cache the app shell, network-first for navigation. */
const CACHE = 'dschat-v1'
const scopeUrl = new URL('./', self.registration.scope).href
const indexUrl = new URL('index.html', self.registration.scope).href

const isCacheableAsset = (value) =>
  value &&
  !value.startsWith('http://') &&
  !value.startsWith('https://') &&
  !value.startsWith('data:') &&
  !value.startsWith('#') &&
  !value.startsWith('mailto:')

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const response = await fetch(indexUrl, { cache: 'reload' })
      if (!response.ok) {
        throw new Error(`Failed to fetch app shell: ${response.status}`)
      }
      const html = await response.clone().text()
      await cache.put(indexUrl, response.clone())
      await cache.put(scopeUrl, response.clone())
      const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((match) => match[1])
        .filter(isCacheableAsset)
      await cache.addAll([...new Set(assets)].map((asset) => new URL(asset, scopeUrl).href))
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('dschat-') && key !== CACHE)
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') {
    return
  }
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put(indexUrl, response.clone())
            await cache.put(scopeUrl, response.clone())
          }
          return response
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match(scopeUrl)) ||
            (await caches.match(indexUrl)) ||
            Response.error()
          )
        }
      })()
    )
    return
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) {
        return cached
      }
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE)
        await cache.put(request, response.clone())
      }
      return response
    })()
  )
})
