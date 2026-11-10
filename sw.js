/* Offline support: app files cached on install; data.js fetched fresh when online, cached copy when offline. */
const VERSION = "v22-2026-11-10";
const CORE = ["./", "index.html", "app.js", "data.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "bp/bp-udi-ey608.png", "bp/bp-udi-ey800.png", "bp/bp-miri-ey608.png", "bp/bp-miri-ey800.png", "bp/vjw-udi.png", "bp/vjw-miri.png", "maps/kamikochi-walking.svg"];
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
    // Weak reception: the network request can hang for a long time instead of failing.
    // Wait at most 2 seconds, then show the saved copy; the network answer (if it comes) still refreshes the cache.
    const net = (url.pathname.endsWith("data.js") ? fetch(req.url, { cache: "no-store" }) : fetch(req))
      .then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; });
    const saved = () => caches.match(req, { ignoreSearch: true }).then(m => m || (req.mode === "navigate" ? caches.match("index.html") : undefined));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => saved().then(m => { if (m && !done) { done = true; resolve(m); } return m; });
      const timer = setTimeout(fallback, 2000);
      net.then(r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } })
         .catch(() => { clearTimeout(timer); fallback().then(m => { if (!done) { done = true; resolve(m || Response.error()); } }); });
    }));
  } else {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});
