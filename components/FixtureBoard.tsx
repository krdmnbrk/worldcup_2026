"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/lib/domain/types";
import { MatchList } from "@/components/MatchList";
import { trCountry } from "@/lib/i18n";
import { useEspnPoll } from "@/components/useEspnPoll";
import { browserAllMatches } from "@/lib/espn/browser";

type StatusFilter = "all" | "live" | "pre" | "post";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "live", label: "Canlı" },
  { key: "post", label: "Oynanan" },
  { key: "pre", label: "Yaklaşan" },
];

export function FixtureBoard({ matches }: { matches: Match[] }) {
  const { data: live } = useEspnPoll(browserAllMatches, 60000, matches);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () =>
      Array.from(
        new Set(live.map((m) => m.group).filter(Boolean) as string[]),
      ).sort(),
    [live],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return live.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (group !== "all" && m.group !== group) return false;
      if (q) {
        const names = [
          m.home.name,
          m.away.name,
          trCountry(m.home.name),
          trCountry(m.away.name),
        ]
          .join(" ")
          .toLocaleLowerCase("tr");
        if (!names.includes(q)) return false;
      }
      return true;
    });
  }, [live, status, group, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === t.key
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/40"
        >
          <option value="all">Tüm gruplar</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              Grup {g}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Takım ara..."
          className="min-w-[160px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-emerald-500/40"
        />
      </div>

      <p className="text-xs text-slate-500">{filtered.length} maç gösteriliyor</p>

      <MatchList
        matches={filtered}
        emptyText="Filtreye uyan maç yok."
      />
    </div>
  );
}
