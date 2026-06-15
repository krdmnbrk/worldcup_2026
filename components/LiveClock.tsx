"use client";

import { useEffect, useState } from "react";
import { parse, tickText, isFrozen, isHalftime } from "@/lib/liveclock";

// Canlı maç dakikasını near-realtime gösterir: ESPN'in displayClock'unu temel alır,
// son veri anından (anchorMs) bu yana geçen süreyi yerel olarak ekler ve her poll'da
// yeniden senkronlanır. Saf ayrıştırma/biçimleme mantığı lib/liveclock.ts'te.
export function LiveClock({
  displayClock,
  statusName,
  anchorMs,
  className = "",
}: {
  displayClock?: string;
  statusName?: string;
  anchorMs: number | null;
  className?: string;
}) {
  const parsed = displayClock ? parse(displayClock) : null;
  const canTick = !isFrozen(statusName) && !!parsed && anchorMs != null;

  // "Şimdi"yi yalnızca interval geri-çağrımında güncelleriz; böylece render saf
  // kalır (Date.now() render içinde çağrılmaz). İlk tik'e kadar anchor anı baz
  // alınır → gösterilen dakika doğru başlar, ~10sn'de bir ilerler.
  const [now, setNow] = useState<number>(anchorMs ?? 0);
  useEffect(() => {
    if (!canTick) return;
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, [canTick, anchorMs, displayClock]);

  if (isHalftime(statusName)) {
    return <span className={className}>Devre arası</span>;
  }
  if (!parsed || !canTick || anchorMs == null) {
    return <span className={className}>{displayClock || ""}</span>;
  }

  const elapsedMin = Math.max(0, Math.floor((now - anchorMs) / 60000));
  return <span className={className}>{tickText(parsed, elapsedMin)}</span>;
}
