// Service Worker básico para PWA Upway
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Petición estándar pasando por la red
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});