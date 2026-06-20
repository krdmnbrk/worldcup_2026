"use client";

import { useEffect, useRef, useState } from "react";

// Canlı maç oynanırken sık, dururken seyrek tazeleme aralığı (ms).
// Tek yerden ayarlanır ki tüm canlı bileşenler tutarlı davransın.
export const LIVE_REFRESH_MS = 15000;
export const IDLE_REFRESH_MS = 60000;
export const liveRefreshMs = (hasLive: boolean) =>
  hasLive ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;

// Tarayıcıda belirli aralıkla ESPN'den veri çeker. Sekme gizliyken bekler,
// sekme tekrar görünür olunca hemen tazeler. SSR'dan gelen `initial` ile başlar.
export function useEspnPoll<T>(
  // null döndürmek "bu sefer güncelleme yok" demektir → son iyi veri korunur,
  // updatedAt ilerlemez (tazelik göstergesi dürüst kalır).
  fetcher: () => Promise<T | null>,
  // Sabit aralık (ms) ya da en güncel veriye bakıp aralık döndüren fonksiyon
  // (canlı maç varken hızlanmak için). Her zamanlamada yeniden hesaplanır.
  intervalMs: number | ((data: T) => number),
  initial: T,
  enabled = true,
  leading = false, // true: mount'ta hemen taze çek (canlı dakika anchor'ı için)
): { data: T; updatedAt: number | null; error: boolean } {
  const [data, setData] = useState<T>(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState(false); // son denemenin başarısızlığı (UI uyarısı için)
  // fetcher, interval ve son veri ref'te tutulur; böylece timer geri-çağrımı her
  // zaman en günceli görür ve bu değerler değişince effect yeniden kurulmaz
  // (gereksiz timer sıfırlaması/çift istek olmaz).
  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef(intervalMs);
  const dataRef = useRef(data);
  useEffect(() => {
    fetcherRef.current = fetcher;
    intervalRef.current = intervalMs;
    dataRef.current = data;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let errors = 0; // ağ hatasında üssel geri çekilme (pil/veri tasarrufu)

    const nextInterval = () => {
      const iv = intervalRef.current;
      return typeof iv === "function" ? iv(dataRef.current) : iv;
    };
    const schedule = () => {
      const backoff = Math.min(2 ** errors, 8); // 1×..8× (maks ~8 kat)
      timer = setTimeout(run, nextInterval() * backoff);
    };
    const run = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        schedule();
        return;
      }
      try {
        const next = await fetcherRef.current();
        if (!cancelled && next != null) {
          dataRef.current = next;
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

    // leading=true ise hemen, değilse bir aralık sonra (SSR initial zaten elimizde)
    timer = setTimeout(run, leading ? 500 : nextInterval());

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
  }, [enabled, leading]);

  return { data, updatedAt, error };
}
