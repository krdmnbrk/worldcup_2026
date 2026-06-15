"use client";

import { useEffect, useState } from "react";

// Canlı maç dakikasını near-realtime gösterir: ESPN'in displayClock'unu temel alır,
// son veri anından (anchorMs) bu yana geçen süreyi yerel olarak ekler ve her poll'da
// yeniden senkronlanır. Devre arası / bitmiş gibi durumlarda saymaz.
const FROZEN = /HALFTIME|HALF_TIME|END|FULL|SHOOTOUT|PENALT|DELAY|ABANDON|SUSPEND/i;

function parse(dc: string): { base: number; plus: number | null } | null {
  const m = dc.match(/^(\d+)'?(?:\s*\+\s*(\d+)'?)?/);
  if (!m) return null;
  return {
    base: parseInt(m[1], 10),
    plus: m[2] != null ? parseInt(m[2], 10) : null,
  };
}

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
  const running = !FROZEN.test(statusName || "");
  const canTick = running && !!parsed && anchorMs != null;

  const [, force] = useState(0);
  useEffect(() => {
    if (!canTick) return;
    const id = setInterval(() => force((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, [canTick, anchorMs, displayClock]);

  if (statusName && /HALFTIME|HALF_TIME/i.test(statusName)) {
    return <span className={className}>Devre arası</span>;
  }
  if (!parsed || !canTick) {
    return <span className={className}>{displayClock || ""}</span>;
  }

  const elapsedMin = Math.max(0, Math.floor((Date.now() - anchorMs!) / 60000));
  const tick = (parsed.plus != null ? parsed.plus : parsed.base) + elapsedMin;
  const text = parsed.plus != null ? `${parsed.base}'+${tick}'` : `${tick}'`;
  return <span className={className}>{text}</span>;
}
