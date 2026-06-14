"use client";

import { useState } from "react";
import { flagcdnUrl } from "@/lib/flags";

export function TeamFlag({
  abbr,
  logo,
  name,
  size = 28,
  className = "",
}: {
  abbr?: string;
  logo?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const candidates = [logo, flagcdnUrl(abbr)].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];

  const box = {
    width: size,
    height: size,
    minWidth: size,
  } as const;

  if (!src) {
    return (
      <span
        style={box}
        className={`grid place-items-center rounded-md bg-slate-700 text-[10px] font-bold text-slate-200 ${className}`}
        title={name}
      >
        {(abbr || name || "?").slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || abbr || "bayrak"}
      width={size}
      height={size}
      loading="lazy"
      style={box}
      onError={() => setIdx((i) => i + 1)}
      className={`rounded-md object-contain ${className}`}
    />
  );
}
