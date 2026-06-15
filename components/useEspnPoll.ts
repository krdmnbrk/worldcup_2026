"use client";

import { useEffect, useRef, useState } from "react";

// Tarayıcıda belirli aralıkla ESPN'den veri çeker. Sekme gizliyken bekler,
// sekme tekrar görünür olunca hemen tazeler. SSR'dan gelen `initial` ile başlar.
export function useEspnPoll<T>(
  // null döndürmek "bu sefer güncelleme yok" demektir → son iyi veri korunur,
  // updatedAt ilerlemez (tazelik göstergesi dürüst kalır).
  fetcher: () => Promise<T | null>,
  intervalMs: number,
  initial: T,
  enabled = true,
  leading = false, // true: mount'ta hemen taze çek (canlı dakika anchor'ı için)
): { data: T; updatedAt: number | null; error: boolean } {
  const [data, setData] = useState<T>(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState(false); // son denemenin başarısızlığı (UI uyarısı için)
  // Ref'i render sırasında değil, her render sonrası effect'te güncelleriz
  // (react-hooks/refs). Timer geri-çağrımı her zaman en güncel fetcher'ı görür.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

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
          setError(false);
          errors = 0;
        }
      } catch {
        if (!cancelled) setError(true);
        errors = Math.min(errors + 1, 4);
      }
      if (!cancelled) schedule();
    };

    // leading=true ise hemen, değilse intervalMs sonra (SSR initial zaten elimizde)
    timer = setTimeout(run, leading ? 500 : intervalMs);

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
  }, [intervalMs, enabled, leading]);

  return { data, updatedAt, error };
}
