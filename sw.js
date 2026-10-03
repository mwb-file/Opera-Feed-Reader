/* Personal news — Service Worker */
const CACHE = "personal-news-v1";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // only touch same-origin requests
  if (url.origin !== location.origin) return;

  // navigation + shell → network-first, offline fallback
  if (req.mode === "navigate" || SHELL.some(p => url.pathname.endsWith(p.replace("./", "")))) {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return r;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match("./index.html"))
        )
    );
  }
});