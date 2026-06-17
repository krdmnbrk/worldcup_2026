import type { TeamMatchStat } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui";

export function MatchSummaryStats({ stats }: { stats: TeamMatchStat[] }) {
  const visible = stats.filter(
    (s) => s.home !== "—" || s.away !== "—",
  );
  if (!visible.length)
    return <EmptyState title="Bu maç için istatistik verisi yok." />;

  return (
    <div className="space-y-3">
      {visible.slice(0, 12).map((s) => {
        const hr = Math.round((s.homeRatio ?? 0.5) * 100);
        const ar = Math.round((s.awayRatio ?? 0.5) * 100);
        return (
          <div key={s.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-white tabular-nums">
                {s.home}
              </span>
              <span className="text-slate-400">{s.label}</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {s.away}
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="bg-amber-500"
                style={{ width: `${hr}%` }}
              />
              <div className="flex-1 bg-indigo-500" style={{ width: `${ar}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
