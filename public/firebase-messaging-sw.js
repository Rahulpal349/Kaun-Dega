// Firebase Cloud Messaging background service worker for Web PWA
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

firebase.initializeApp(firebaseConfig);

let messaging;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging init notice:', e.message);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
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

// Fallback raw push event handler
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
