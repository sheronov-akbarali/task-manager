// ===== SERVICE WORKER — TaskFlow =====
const CACHE_NAME = 'taskflow-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// O'rnatish — fayllarni keshga saqlash
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Faollashtirish — eski keshni tozalash
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// So'rovlarni ushlash — offline ishlash
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).catch(function() {
        return caches.match('/index.html');
      });
    })
  );
});

// Push bildirishnomalar
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'TaskFlow', {
      body: data.body || 'Yangi eslatma!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
