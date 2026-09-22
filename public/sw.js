// Combined PWA Offline Cache + Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDrJtNTavCl3dPCAm3t6bx9Yn7OBgEKExI",
  authDomain: "kaun-dega-3a5cc.firebaseapp.com",
  projectId: "kaun-dega-3a5cc",
  storageBucket: "kaun-dega-3a5cc.firebasestorage.app",
  messagingSenderId: "889585560545",
  appId: "1:889585560545:web:2219eec7e87e56808480a0"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (_) {}

let messaging;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[sw.js] Firebase Messaging init notice:', e.message);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received FCM background message:', payload);
    const title = payload.notification?.title || payload.data?.title || 'Kaun Dega? 💸';
    const options = {
      body: payload.notification?.body || payload.data?.body || 'New activity in your group.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'open', title: 'Open Ledger' }
      ]
    };
    return self.registration.showNotification(title, options);
  });
}

const CACHE_NAME = 'kaun-dega-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/history',
  '/profile',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Fallback push event handler for direct webpush payloads
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.title || payload.notification?.title || payload.data?.title || 'Kaun Dega? 💸';
      const options = {
        body: payload.body || payload.notification?.body || payload.data?.body || 'New activity in your group.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: payload.data || payload,
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (_) {
      event.waitUntil(
        self.registration.showNotification('Kaun Dega? 💸', {
          body: event.data.text() || 'New activity in your group.',
          icon: '/icon-192x192.png',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const groupId = event.notification.data?.groupId || event.notification.data?.group_id;
  const targetUrl = groupId ? `/groups/${groupId}` : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
