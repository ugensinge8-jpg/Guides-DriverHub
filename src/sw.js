/* Bhutan Tourism Hub — service worker (BUILD 55, vite-plugin-pwa "injectManifest").
   1. Keeps the app itself on the phone, so it opens without a connection.
   2. A new version waits until "Update" is tapped in the app. The one exception is the first hand-over from
      the worker used before BUILD 55: that one updated by itself and its pages cannot ask, so it is replaced
      at once and nobody is left on an old version.
   3. Shows push notifications when the app is closed, and opens the right screen when one is tapped.
   4. Keeps the last 30 notifications, so the app can list them without a connection. */
import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

const META = "bth-meta";                 // this worker's own small records (precache clean-up leaves it alone)
const PROTOCOL = "/__bth/sw-protocol";   // present once a worker that waits for "Update" has run on this phone
const INBOX = "/__bth/inbox";            // the last notifications, newest first
const ICON = "/icon-192.png";
const BADGE = "/badge-96.png";

/* 1. Opening the app. A page of the app (any address without a file extension) opens from the phone: its own
      precached page if there is one ("/guides" → guides.html), otherwise the app. Files — robots.txt,
      sitemap.xml, guides.html, icons, the terrain data — and this worker's records are left to the precache
      and the network. Registered before the precache router, and it stops there, so a navigation is answered
      once. */
const NOT_APP = [/^\/__/, /\/[^/?#]+\.[a-z0-9]{2,8}$/i];
const isPage = (url) => url.origin === self.location.origin && !NOT_APP.some((re) => re.test(url.pathname));
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate" || req.method !== "GET") return;
  const url = new URL(req.url);
  if (!isPage(url)) return;
  event.stopImmediatePropagation();
  event.respondWith((async () => {
    const own = url.pathname !== "/" ? await matchPrecache(url.pathname.replace(/\/+$/, "") + ".html") : null;
    return own || (await matchPrecache("index.html")) || fetch(req);
  })());
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

/* 2. Updates */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const meta = await caches.open(META);
    if (!(await meta.match(PROTOCOL))) await self.skipWaiting();   // replacing the worker from before BUILD 55
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.open(META).then((c) => c.put(PROTOCOL, new Response("prompt-1"))));
});
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* 3–4. Notifications */
async function remember(item) {
  try {
    const meta = await caches.open(META);
    const old = await meta.match(INBOX);
    const list = old ? await old.json() : [];
    const next = [item, ...(Array.isArray(list) ? list : []).filter((x) => x && x.id !== item.id)].slice(0, 30);
    await meta.put(INBOX, new Response(JSON.stringify(next), { headers: { "Content-Type": "application/json" } }));
  } catch (e) {}
}
// windows showing the app itself — it lives at "/"; a static page such as /guides is not the app
async function appWindows() {
  const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return all.filter((c) => { try { const u = new URL(c.url); return u.origin === self.location.origin && u.pathname === "/"; } catch (e) { return false; } });
}
async function tellOpenWindows(message) {
  try { (await appWindows()).forEach((c) => c.postMessage(message)); } catch (e) {}
}
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : "" }; }
  const title = d.title || "Bhutan Tourism Hub";
  const tag = d.tag ? String(d.tag) : "";
  const item = { id: tag || "push-" + Date.now(), title, body: d.body || "", url: d.url || "/", ts: Date.now() };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: item.body, icon: ICON, badge: BADGE, data: { url: item.url },
      ...(tag ? { tag, renotify: true } : {}),
    }),
    remember(item),
    tellOpenWindows({ type: "bth-push", item }),
  ]));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const win = (await appWindows())[0];
    if (win) {   // the app is open: bring it forward and show the screen there
      try { await win.focus(); } catch (e) {}
      win.postMessage({ type: "bth-open", url: target });
      return;
    }
    await self.clients.openWindow(target);
  })());
});
