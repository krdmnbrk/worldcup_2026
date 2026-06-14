"use client";

import { useState } from "react";
import { PLAYER_PHOTOS } from "@/data/player-photos";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerImage({
  id,
  src,
  name,
  size = 48,
  className = "",
}: {
  id?: string;
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  // Öncelik sırası: elle eklenen statik foto (ör. Türkiye kadrosu, Wikimedia) →
  // ESPN headshot href → baş-harf avatarı.
  const local =
    id && PLAYER_PHOTOS[id] ? `${BASE}/players/${PLAYER_PHOTOS[id]}` : undefined;
  const candidates = [local, src].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const url = candidates[idx];
  const box = { width: size, height: size, minWidth: size } as const;

  if (!url) {
    return (
      <span
        style={box}
        className={`grid place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-slate-200 ${className}`}
        title={name}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      style={box}
      onError={() => setIdx((i) => i + 1)}
      className={`rounded-full bg-slate-800 object-cover ${className}`}
    />
  );
}
