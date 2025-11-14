// Service Worker for 2GoWhere - Caching and Performance
const CACHE_NAME = '2gowhere-cache-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/assets/style.min.css',
  '/manifest.json'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🚀 Service Worker: Caching critical resources');
        return cache.addAll(CACHE_URLS);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle image requests with special caching strategy
  if (event.request.url.includes('images.unsplash.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(response => {
              // Don't cache if not a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Return placeholder image if offline
              return new Response(
                `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
                  <rect width="100%" height="100%" fill="#333"/>
                  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="14">Offline</text>
                </svg>`,
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'preload-images') {
    event.waitUntil(preloadCriticalImages());
  }
});

// Preload critical images
function preloadCriticalImages() {
  const criticalImages = [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop&auto=format&q=75',
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop&auto=format&q=75',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=75'
  ];
  
  return Promise.all(
    criticalImages.map(url => {
      return fetch(url)
        .then(response => {
          if (response.ok) {
            return caches.open(CACHE_NAME)
              .then(cache => cache.put(url, response));
          }
        })
        .catch(error => console.log('Preload failed for:', url));
    })
  );
}

// Push notification handling (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data.url
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

console.log('🎯 2GoWhere Service Worker loaded successfully!');