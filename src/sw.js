/* Custom service worker (vite-plugin-pwa injectManifest mode). */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

const ICON = "https://nxnsdnayzimzfiwjrkvv.supabase.co/storage/v1/object/public/icons/icon-192.png";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data.json(); } catch (e) {}
  const title = data.title || "Bhutan Tourism Hub";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: ICON,
      badge: ICON,
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
