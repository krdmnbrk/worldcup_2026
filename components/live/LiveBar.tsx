"use client";

import Link from "next/link";
import { useEspnPoll } from "@/components/useEspnPoll";
import { browserLiveToday } from "@/lib/espn/browser";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";
import type { Match } from "@/lib/domain/types";

// Mobilde alt navigasyonun hemen üstünde sabit duran canlı maç çubuğu.
// Canlı maç yoksa görünmez. Hafif (tek istek) ve yalnızca mobilde.
export function LiveBar() {
  const { data } = useEspnPoll<Match[]>(browserLiveToday, 45000, []);
  const live = data.filter((m) => m.status === "in");
  if (!live.length) return null;
  const m = live[0];

  return (
    <Link
      href={`/maclar/${m.id}`}
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-red-500/30 bg-[#0b1018]/95 backdrop-blur md:hidden"
      aria-label="Canlı maç"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
        <span className="live-dot h-2 w-2 shrink-0 rounded-full bg-red-400" />
        <TeamFlag abbr={m.home.abbr} logo={m.home.logo} name={m.home.name} size={18} />
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-white">
          {trCountry(m.home.name)}
        </span>
        <span className="shrink-0 font-mono text-sm font-extrabold tabular-nums text-white">
          {m.home.score ?? 0}-{m.away.score ?? 0}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">
          {trCountry(m.away.name)}
        </span>
        <TeamFlag abbr={m.away.abbr} logo={m.away.logo} name={m.away.name} size={18} />
        <span className="shrink-0 text-[10px] font-semibold text-red-300">
          {m.clock || "Canlı"}
        </span>
        {live.length > 1 && (
          <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
            +{live.length - 1}
          </span>
        )}
      </div>
    </Link>
  );
}
