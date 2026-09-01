const CACHE = 'manuman-v1';
const STATIC = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/config.js',
  '/images/logo.jpeg',
  '/images/fleet-card.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only cache GET requests, skip API and Stripe calls
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('manuman-api.vercel.app')) return;
  if (e.request.url.includes('js.stripe.com')) return;
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
