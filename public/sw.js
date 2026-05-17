// Service worker do FreeDraw — habilita a instalação como PWA e dá
// suporte offline básico às páginas já visitadas.
const CACHE = "freedraw-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Estratégia "rede primeiro": sempre busca conteúdo atualizado, mas guarda
// uma cópia das navegações para servir caso o usuário fique offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.mode === "navigate" && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/dashboard");
          if (fallback) return fallback;
        }
        return Response.error();
      }),
  );
});
