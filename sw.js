// network-first: קודם רשת, ושומרים עותק. אין רשת: מהמטמון.
// בקשה ל-/api, בקשה שאינה GET, או לכתובת אחרת: לא נוגעים בה.
const CACHE = 'joke-v3';

const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/assets/logo.svg',
  '/assets/mascot-idle.svg',
  '/assets/mascot-think.svg',
  '/assets/mascot-joke.svg',
  '/assets/mascot-error.svg',
  '/assets/bg-dots.svg',
  '/assets/bg-doodles.svg',
  '/assets/icon.svg',
  '/assets/icon-maskable.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: true })
          .then((cached) => cached || (request.mode === 'navigate' ? caches.match('/') : undefined))
          .then((cached) => cached || Response.error())
      )
  );
});
