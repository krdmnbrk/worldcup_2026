"use client";

import { useEffect, useRef, useState } from "react";

// Tarayıcıda belirli aralıkla ESPN'den veri çeker. Sekme gizliyken bekler,
// sekme tekrar görünür olunca hemen tazeler. SSR'dan gelen `initial` ile başlar.
export function useEspnPoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  initial: T,
  enabled = true,
): { data: T; updatedAt: number | null } {
  const [data, setData] = useState<T>(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let errors = 0; // ağ hatasında üssel geri çekilme (pil/veri tasarrufu)

    const schedule = () => {
      const backoff = Math.min(2 ** errors, 8); // 1×..8× (maks ~8 kat)
      timer = setTimeout(run, intervalMs * backoff);
    };
    const run = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        schedule();
        return;
      }
      try {
        const next = await fetcherRef.current();
        if (!cancelled && next != null) {
          setData(next);
          setUpdatedAt(Date.now());
          errors = 0;
        }
      } catch {
        errors = Math.min(errors + 1, 4);
      }
      if (!cancelled) schedule();
    };

    // İlk turu intervalMs sonra çalıştır (SSR initial zaten elimizde)
    timer = setTimeout(run, intervalMs);

    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, enabled]);

  return { data, updatedAt };
}
