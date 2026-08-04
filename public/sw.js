// Service Worker para PWA Upway - Blindado
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. IGNORAR completamente el Dashboard, las API y los recursos de Next.js
  if (
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') ||
    event.request.method !== 'GET'
  ) {
    return; // Dejar que el navegador maneje la red con total normalidad
  }

  // 2. Petición segura con manejo de errores para evitar el TypeError
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      
      // Si está en caché, lo devolvemos
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 🔥 LA SOLUCIÓN: Si no hay red ni caché, devolvemos un Response plano controlado
      return new Response('Sin conexión a internet', { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' } 
      });
    })
  );
});