// Muhafazakâr service worker — yalnızca kendi origin'i önbellekler.
// HTML: network-first (yeni dağıtım her zaman taze gelir). Hashed statik varlık: cache-first.
// ESPN / CDN (çapraz origin) istekleri DOKUNULMAZ → her zaman ağdan (canlı skor tazeliği).
const CACHE = "wc2026-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ESPN/flagcdn/espncdn → ağ

  // Değişmeyen hashed varlıklar: cache-first
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Sayfa gezinmesi (HTML): network-first, çevrimdışıysa cache
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const c = await caches.open(CACHE);
          c.put(req, res.clone());
          return res;
        } catch {
          const c = await caches.open(CACHE);
          return (await c.match(req)) || (await c.match(self.location.pathname)) || Response.error();
        }
      })(),
    );
  }
});
