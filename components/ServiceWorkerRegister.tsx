"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do PWA. Só roda em produção — em
 * desenvolvimento o cache do SW atrapalha o hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[pwa] Falha ao registrar o service worker:", err);
    });
  }, []);

  return null;
}
