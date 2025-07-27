const CACHE_NAME = 'platinumedge-v1.0.0';
const OFFLINE_URL = '/offline';

// Critical resources to cache for offline functionality
const CRITICAL_RESOURCES = [
  '/',
  '/dashboard',
  '/players',
  '/organizations',
  '/favorites',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS bundles (will be added by build process)
];

// API endpoints to cache with limited TTL
const API_CACHE_PATTERNS = [
  '/api/auth/me',
  '/api/players',
  '/api/organizations',
  '/api/favorites',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve from cache or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Handle API requests with cache-first strategy for specific endpoints
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_PATTERNS.some(pattern => 
      url.pathname.startsWith(pattern)
    );

    if (shouldCache) {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              // Serve from cache and update in background
              fetch(request)
                .then((response) => {
                  if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                      cache.put(request, responseClone);
                    });
                  }
                })
                .catch(() => {
                  // Network failed, cached version is still valid
                });
              return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(request)
              .then((response) => {
                if (response.ok) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                  });
                }
                return response;
              })
              .catch(() => {
                // Return offline response for API failures
                return new Response(JSON.stringify({
                  error: 'Offline',
                  message: 'This feature requires an internet connection'
                }), {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                });
              });
          })
      );
      return;
    }
  }

  // Handle static resources with cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Return placeholder for failed static resources
              if (request.destination === 'image') {
                return new Response(
                  '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Offline</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return new Response('/* Offline */', {
                headers: { 'Content-Type': 'text/css' }
              });
            });
        })
    );
    return;
  }

  // Default: network-first for all other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match(OFFLINE_URL);
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
  
  if (event.tag === 'sync-player-data') {
    event.waitUntil(syncPlayerData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from PlatinumEdge Analytics',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/action-dismiss.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'PlatinumEdge Analytics',
        options
      )
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/dashboard';
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Helper functions for background sync
async function syncFavorites() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingFavorites = await cache.match('/offline-favorites');
    
    if (pendingFavorites) {
      const data = await pendingFavorites.json();
      // Sync favorites with server
      await fetch('/api/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete('/offline-favorites');
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync favorites', error);
  }
}

async function syncPlayerData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingData = await cache.match('/offline-player-data');
    
    if (pendingData) {
      const data = await pendingData.json();
      // Sync player data with server
      await fetch('/api/players/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete('/offline-player-data');
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync player data', error);
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
    console.log('Service Worker: Performance measure', event.data);
    // Send performance data to analytics
  }
});

console.log('Service Worker: Loaded successfully');