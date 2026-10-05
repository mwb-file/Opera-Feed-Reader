/* Personal news — Service Worker */
const CACHE = "personal-news-v6";
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

  // CDN fonts: stale-while-revalidate, so the UI keeps its typeface offline.
  if (url.hostname === "cdn.jsdelivr.net") {
    // Fetch synchronously so e.waitUntil() is called during dispatch.
    const networkPromise = fetch(req);
    e.waitUntil(
      networkPromise
        .then(r => {
          // Cross-origin no-cors font requests can be opaque (status 0)
          // and are still valid cache entries.
          if (r.ok || r.type === "opaque") {
            return caches.open(FONTS)
              .then(c => c.put(req, r.clone()))
              .catch(() => {});
          }
        })
        .catch(() => {})
    );
    e.respondWith((async () => {
      try {
        return await networkPromise;
      } catch {
        try {
          const hit = await caches.match(req);
          return hit || Response.error();
        } catch {
          return Response.error();
        }
      }
    })());
    return;
  }
  if (url.origin !== location.origin) return;

  // App shell only: network first, cached copy when offline.
  const isShell = req.mode === "navigate"
    || SHELL.some(p => p !== "./" && url.pathname.endsWith(p.slice(2)));
  if (!isShell) return;

  const networkPromise = fetch(req);
  e.waitUntil(
    networkPromise
      .then(r => {
        const copy = r.clone();
        return caches.open(CACHE)
          .then(c => c.put(req, copy))
          .catch(() => {});
      })
      .catch(() => {})
  );
  e.respondWith((async () => {
    try {
      return await networkPromise;
    } catch {
      const hit = await caches.match(req);
      return hit || (await caches.match("./index.html"));
    }
  })());
});
