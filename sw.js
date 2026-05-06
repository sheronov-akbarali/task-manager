const CACHE = 'taskflow-v2';
const FILES = [
  '/task-manager/',
  '/task-manager/index.html',
  '/task-manager/style.css',
  '/task-manager/app.js',
  '/task-manager/manifest.json',
  '/task-manager/icons/icon-192.png',
  '/task-manager/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        return caches.open(CACHE).then(c => {
          c.put(e.request, res.clone());
          return res;
        });
      }).catch(() => caches.match('/task-manager/index.html'));
    })
  );
});
