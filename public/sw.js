// Minimal Service Worker for PWA compatibility
// Caching is disabled to prevent issues with Vite's hashed asset filenames

// Install event - no caching
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - always fetch from network
self.addEventListener('fetch', (event) => {
  // Always fetch from network, no caching
  event.respondWith(fetch(event.request));
});

// Activate event - clean up any existing caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all existing caches
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});