"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Service worker'ı yalnızca üretimde (GitHub Pages) kaydeder; geliştirmede
// önbellek karışıklığını önlemek için devre dışı.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;
    navigator.serviceWorker
      .register(`${BASE}/sw.js`, { scope: `${BASE}/` })
      .catch(() => {
        /* sessizce geç */
      });
  }, []);
  return null;
}
