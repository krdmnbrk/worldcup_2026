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

    const schedule = () => {
      timer = setTimeout(run, intervalMs);
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
        }
      } catch {
        /* sessizce geç, bir sonraki turda tekrar dene */
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
