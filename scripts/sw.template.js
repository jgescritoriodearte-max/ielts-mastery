/* IELTS Mastery service worker — offline-first.
   - App shell: versioned cache "shell-<VERSION>", replaced atomically on update.
   - Content packs: caches "pack-<id>@<version>", managed by the app; NEVER deleted here.
   - User data lives in IndexedDB and is never touched by the service worker. */
const VERSION = "__VERSION__";
const SHELL = "shell-" + VERSION;
const META = "meta-v1";
const SHELL_FILES = __SHELL__;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_FILES.map((u) => new Request(u, { cache: "reload" })));
    // First install: activate immediately. Updates wait until the user chooses "Reload".
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("shell-") && key !== SHELL) await caches.delete(key); // only old app shells
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  const path = url.pathname.slice(scope.pathname.length);

  // Navigation: always the cached shell (hash routing), network only as a fallback.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = (await cache.match("index.html")) || (await cache.match("./"));
      if (hit) return hit;
      try { return await fetch(req); } catch { return new Response("<h1>IELTS Mastery</h1><p>Open the app once while online to install it for offline use.</p>", { headers: { "Content-Type": "text/html" } }); }
    })());
    return;
  }

  // Pack catalogue: network first (to discover updates), saved copy when offline.
  if (path === "packs/index.json") {
    event.respondWith((async () => {
      const meta = await caches.open(META);
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) await meta.put(req, res.clone());
        return res;
      } catch {
        return (await meta.match(req)) || new Response(JSON.stringify({ packs: [] }), { headers: { "Content-Type": "application/json" } });
      }
    })());
    return;
  }

  // Pack files: from any pack cache; network if not downloaded (not cached automatically).
  if (path.startsWith("packs/")) {
    event.respondWith((async () => (await caches.match(req, { ignoreSearch: true })) || fetch(req))());
    return;
  }

  // App assets: shell cache first (hashed file names never change content).
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && (path.startsWith("assets/") || path.startsWith("icons/"))) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response("", { status: 504, statusText: "Offline" });
    }
  })());
});
