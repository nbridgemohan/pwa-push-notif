const CACHE_NAME = 'pwa-sample-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Ensure the new service worker activates immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
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
  return self.clients.claim(); // Take control of all clients
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log('[Service Worker] Push had this data:', event.data?.text());

  let notificationData;
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'New Notification',
      body: event.data.text()
    };
  }

  console.log('[Service Worker] Notification Data:', notificationData);

  const options = {
    body: notificationData.body || 'No message content',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200], // More noticeable vibration pattern
    sound: 'default', // Add sound
    requireInteraction: true, // Keep notification visible until user interacts
    data: {
      dateOfArrival: Date.now(),
      url: self.location.origin,
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ],
    tag: Date.now().toString(), // Unique tag for each notification
    renotify: true,
    silent: false // Ensure system plays a sound
  };

  // Log registration state
  self.registration.pushManager.getSubscription()
    .then(subscription => {
      console.log('[Service Worker] Current subscription:', subscription);
    });

  // Log permission state
  console.log('[Service Worker] Notification permission:', self.registration.scope);

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'PWA Notification', options)
      .then(() => {
        console.log('[Service Worker] Notification displayed successfully');
        // Verify notification was created
        return self.registration.getNotifications();
      })
      .then(notifications => {
        console.log('[Service Worker] Active notifications:', notifications.length);
        notifications.forEach(notification => {
          console.log('[Service Worker] Active notification:', notification);
        });
      })
      .catch(error => {
        console.error('[Service Worker] Error showing notification:', error);
      })
  );
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(function(clientList) {
        // If we have a matching client, focus it
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no matching client, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Message handling (for updates)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 