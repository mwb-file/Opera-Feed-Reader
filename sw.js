/* Personal news — Service Worker */
const CACHE = "personal-news-v5";
const FONTS = "personal-news-fonts-v1";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // CDN fonts: stale-while-revalidate, so the UI keeps its typeface offline
  if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // App shell only: network first, cached copy when offline
  const isShell = req.mode === "navigate" || SHELL.some(p => p !== "./" && url.pathname.endsWith(p.slice(2)));
  if (!isShell) return;
  e.respondWith(
    fetch(req)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});