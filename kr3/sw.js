const CACHE_NAME = "notes-cache-v2";
const DYNAMIC_CACHE_NAME = "dynamic-content-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-48x48.png",
  "/icons/favicon-64x64.png",
  "/icons/favicon-128x128.png",
  "/icons/favicon-256x256.png",
  "/icons/favicon-512x512.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});
// Для статики – Cache First, для контента – Network First
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Пропускаем запросы к другим источникам (например, к CDN chota)
  if (url.origin !== location.origin) return;
  // Динамические страницы (content/*) – сначала сеть, затем кэш
  if (url.pathname.startsWith("/content/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          // Кэшируем свежий ответ
          const resClone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
          return networkRes;
        })
        .catch(() => {
          // Если сеть недоступна, берём из кэша (или home как fallback)
          return caches
            .match(event.request)
            .then((cached) => cached || caches.match("/content/home.html"));
        }),
    );
  }
});

self.addEventListener("push", (event) => {
  console.log("Push event received (not used for reminders)");
  // Push notifications не используются для напоминаний на localhost
  // Вместо этого используются WebSocket + Notification API
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked", event.action, event.notification.data);
  event.notification.close();

  const promiseChain = (async () => {
    if (event.action === "snooze" && event.notification.data?.reminderId) {
      try {
        await fetch(
          `/snooze?reminderId=${event.notification.data.reminderId}`,
          {
            method: "POST",
          },
        );
      } catch (err) {
        console.error("Snooze request failed:", err);
      }
    }

    const windowClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of windowClients) {
      if (client.url === "/" || client.url.endsWith("/index.html")) {
        client.focus();
        return;
      }
    }
    if (clients.openWindow) {
      await clients.openWindow("/");
    }
  })();

  event.waitUntil(promiseChain);
});
