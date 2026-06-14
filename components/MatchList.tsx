import type { Match } from "@/lib/domain/types";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/ui";
import { istanbulDayKey, formatDate, weekdayLong } from "@/lib/datetime";

export function MatchList({
  matches,
  emptyText = "Maç bulunamadı.",
  groupByDay = true,
  showGroup = true,
}: {
  matches: Match[];
  emptyText?: string;
  groupByDay?: boolean;
  showGroup?: boolean;
}) {
  if (!matches.length) return <EmptyState title={emptyText} />;

  if (!groupByDay) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} showGroup={showGroup} />
        ))}
      </div>
    );
  }

  const days = new Map<string, Match[]>();
  for (const m of matches) {
    const k = istanbulDayKey(m.date);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(m);
  }
  const sortedDays = Array.from(days.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-6">
      {sortedDays.map(([key, dayMatches]) => (
        <div key={key}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">
              {formatDate(dayMatches[0].date)}
            </h3>
            <span className="text-xs capitalize text-slate-500">
              {weekdayLong(dayMatches[0].date)}
            </span>
            <span className="ml-auto text-xs text-slate-500">
              {dayMatches.length} maç
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} showGroup={showGroup} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
