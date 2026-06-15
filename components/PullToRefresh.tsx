"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Mobilde sayfanın en üstünden aşağı çekince yenileme. Passive dinleyiciler
// kullanır (kaydırmayı engellemez); masaüstünde (dokunmasız) hiç tetiklenmez.
export function PullToRefresh({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const THRESHOLD = 70;
    const atTop = () =>
      (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      startY.current = atTop() ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      set(dy > 0 && atTop() ? Math.min(dy * 0.5, 90) : 0);
    };
    const onEnd = () => {
      if (pullRef.current > THRESHOLD && !busy.current) {
        busy.current = true;
        setRefreshing(true);
        setTimeout(() => location.reload(), 200);
      }
      startY.current = null;
      set(0);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <>
      {(pull > 0 || refreshing) && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center md:hidden"
          style={{ transform: `translateY(${refreshing ? 14 : pull / 2}px)` }}
        >
          <div className="mt-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-black shadow-lg">
            {refreshing
              ? "Yenileniyor…"
              : pull > 70
                ? "Bırak ↻"
                : "Aşağı çek ↓"}
          </div>
        </div>
      )}
      {children}
    </>
  );
}
