const CACHE_NAME = 'diary-wish-cache-v1';
const STATIC_FILES = [
  '/',
  '/static/css/style.css',
  '/static/js/handwriting.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES)).catch(() => {})
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
