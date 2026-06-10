// service-worker.js — runs in the background, handles push events

// ─── Install & Activate ───────────────────────────────────────────────────────
globalThis.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  globalThis.skipWaiting(); // activate immediately
});

globalThis.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(globalThis.clients.claim()); // take control of all tabs
});

// ─── Push Event ───────────────────────────────────────────────────────────────
globalThis.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: '🔔 Notification',
    body: 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
    url: '/',
    tag: 'default'
  };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch (e) {
      console.warn('[SW] Push payload was not JSON, using raw text payload', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,          // deduplicate notifications with same tag
    renotify: true,         // re-vibrate even if same tag
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url },
    actions: [
      { action: 'open',    title: '🔗 Open App' },
      { action: 'dismiss', title: '✖ Dismiss'  }
    ]
  };

  event.waitUntil(
    globalThis.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
globalThis.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if open
        for (const client of clients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        if (globalThis.clients.openWindow) {
          return globalThis.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Push Subscription Change ─────────────────────────────────────────────────
globalThis.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Subscription changed — re-subscribing…');
  event.waitUntil(
    globalThis.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      })
  );
});
