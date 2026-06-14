import Link from "next/link";
import type { StatLeader, TeamGoalCount } from "@/lib/domain/types";
import { PlayerImage } from "@/components/PlayerImage";
import { TeamFlag } from "@/components/TeamFlag";
import { EmptyState } from "@/components/ui";
import { trCountry } from "@/lib/i18n";

type Entry = {
  id: string;
  name: string;
  sub?: string;
  value: number;
  headshot?: string;
  teamAbbr?: string;
  logo?: string;
  href?: string;
};

export function StatLeaderboard({
  entries,
  kind,
  unit = "",
  emptyText = "Henüz veri yok.",
}: {
  entries: Entry[];
  kind: "player" | "team";
  unit?: string;
  emptyText?: string;
}) {
  if (!entries.length) return <EmptyState title={emptyText} />;
  const max = Math.max(...entries.map((e) => e.value), 1);

  return (
    <ol className="space-y-1.5">
      {entries.map((e, i) => {
        const inner = (
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
            <span className="w-5 text-center text-xs font-bold text-slate-500">
              {i + 1}
            </span>
            {kind === "player" ? (
              <PlayerImage id={e.id} src={e.headshot} name={e.name} size={32} />
            ) : (
              <TeamFlag abbr={e.teamAbbr} logo={e.logo} name={e.name} size={26} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {kind === "team" ? trCountry(e.name) : e.name}
              </p>
              {e.sub && (
                <p className="truncate text-[11px] text-slate-500">{e.sub}</p>
              )}
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(e.value / max) * 100}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 font-mono text-base font-bold text-emerald-300 tabular-nums">
              {e.value}
              {unit}
            </span>
          </div>
        );
        return (
          <li key={e.id + i}>
            {e.href ? <Link href={e.href}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ol>
  );
}

export function scorerEntries(items: StatLeader[]): Entry[] {
  return items.map((s) => ({
    id: s.id,
    name: s.name,
    sub: s.teamName ? trCountry(s.teamName) : s.teamAbbr,
    value: s.value,
    headshot: s.headshot,
    href: /^\d+$/.test(s.id) ? `/oyuncular/${s.id}` : undefined,
  }));
}

export function teamGoalEntries(items: TeamGoalCount[]): Entry[] {
  return items.map((t) => ({
    id: t.teamId,
    name: t.teamName,
    value: t.value,
    teamAbbr: t.teamAbbr,
    logo: t.logo,
    href: `/takimlar/${t.teamId}`,
  }));
}
