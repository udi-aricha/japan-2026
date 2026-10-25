/* Offline support: app files cached on install; data.js fetched fresh when online, cached copy when offline. */
const VERSION = "v8-2026-10-25";
const CORE = ["./", "index.html", "app.js", "data.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  const freshFirst = sameOrigin && (url.pathname.endsWith("data.js") || req.mode === "navigate");
  if (freshFirst) {
    const net = url.pathname.endsWith("data.js") ? fetch(req.url, { cache: "no-store" }) : fetch(req);
    e.respondWith(net.then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(m => m || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});
