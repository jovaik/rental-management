
const CACHE_NAME = 'rental-app-v3'; // Incrementado para forzar bypass de APIs de gastos/clientes
const urlsToCache = [
  '/',
  '/dashboard',
  '/planning',
  '/vehicles',
  '/customers'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  // ❌ NO CACHEAR peticiones POST/PUT/DELETE/PATCH
  // ✅ Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ BYPASS COMPLETO PARA CONTRATOS: No interceptar, dejar pasar directamente
  // Esto evita timeouts en generación de PDFs pesados y problemas de caché con IDs antiguos
  if (event.request.url.includes('/api/contracts')) {
    // NO interceptar, dejar que el browser maneje la petición directamente
    return;
  }

  // ✅ BYPASS PARA OTRAS APIs CRÍTICAS QUE NO DEBEN CACHEARSE
  const bypassUrls = ['/api/bookings', '/api/inspections', '/api/deposits', '/api/gastos', '/api/customers'];
  if (bypassUrls.some(url => event.request.url.includes(url))) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en cache
        // ⚠️ IMPORTANTE: Solo cachear páginas estáticas, NO APIs
        if (response && response.status === 200 && !event.request.url.includes('/api/')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla el fetch, intentar desde cache
        return caches.match(event.request);
      })
  );
});
