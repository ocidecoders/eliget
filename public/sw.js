const CACHE_NAME = 'eliget-v1';
const urlsToCache = [
  '/manifest.json',
  '/favicon.svg',
  '/theme.js',
  '/splash.js',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // API কল এবং HTML পেজগুলো Service Worker ইন্টারসেপ্ট করবে না
  if (event.request.url.includes('/api/') || event.request.mode === 'navigate') {
    return; // সার্ভার থেকে সরাসরি লোড হবে
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
