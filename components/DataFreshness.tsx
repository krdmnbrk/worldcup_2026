"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

// Canlı veri tazeliği göstergesi: son başarılı güncellemeden bu yana geçen süreyi
// ("az önce", "3 dk önce") gösterir; son çekim başarısızsa uyarı verir. Kullanıcı
// böylece eski skoru taze sanmaz. Date.now() render içinde çağrılmaz (saf render).
function rel(sec: number): string {
  if (sec < 45) return "az önce";
  const m = Math.floor(sec / 60);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  return `${h} sa önce`;
}

export function DataFreshness({
  updatedAt,
  error = false,
  className = "",
}: {
  updatedAt: number | null;
  error?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<number>(updatedAt ?? 0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (updatedAt == null) {
    if (error)
      return (
        <span className={`inline-flex items-center gap-1 text-amber-300 ${className}`}>
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Veri alınamıyor
        </span>
      );
    return null;
  }

  const ageSec = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (error) {
    return (
      <span className={`inline-flex items-center gap-1 text-amber-300 ${className}`}>
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Güncellenemiyor · son veri {rel(ageSec)}
      </span>
    );
  }
  return (
    <span className={`text-slate-500 ${className}`}>
      Güncellendi · {rel(ageSec)}
    </span>
  );
}
