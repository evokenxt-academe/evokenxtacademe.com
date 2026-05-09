// Firebase Cloud Messaging Service Worker
// IMPORTANT: This file must be served from the root domain (not /src)
// Next.js automatically serves files in /public at the root
// Config is duplicated here because service workers cannot access Next.js env vars
// These are PUBLIC keys — safe to include in SW

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || "PASTE_YOUR_API_KEY",
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || "PASTE_YOUR_AUTH_DOMAIN",
  projectId:         self.FIREBASE_PROJECT_ID         || "PASTE_YOUR_PROJECT_ID",
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| "PASTE_YOUR_SENDER_ID",
  appId:             self.FIREBASE_APP_ID             || "PASTE_YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle BACKGROUND messages (when app is not in focus / tab is closed)
messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification ?? {};
  const data = payload.data ?? {};

  const notificationTitle = title ?? 'Evoke EduGlobal';
  const notificationOptions = {
    body:  body ?? '',
    icon:  '/logo.jpg',
    badge: '/logo.jpg',
    image: image ?? data.image ?? undefined,
    data:  { ...data, route: data.route ?? '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.type ?? 'evoke-notification',
    renotify: true,
    requireInteraction: data.type === 'live_stream',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification CLICK → navigate to deep-link route
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const route = event.notification.data?.route ?? '/dashboard';
  const url   = new URL(route, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
