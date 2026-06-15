"use client";

import { useFavoriteTeam } from "@/components/useFavoriteTeam";

export function FavoriteToggle({ teamId }: { teamId: string }) {
  const { fav, toggle } = useFavoriteTeam();
  const active = fav === teamId;
  return (
    <button
      type="button"
      onClick={() => toggle(teamId)}
      aria-pressed={active}
      className={`inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
          : "border-white/15 bg-white/[0.04] text-slate-200 hover:text-white"
      }`}
    >
      {active ? "★ Takip ediliyor" : "☆ Takip et"}
    </button>
  );
}
