import Link from "next/link";
import type { Match } from "@/lib/domain/types";
import { TeamFlag } from "@/components/TeamFlag";
import { LiveBadge, Pill } from "@/components/ui";
import { trCountry } from "@/lib/i18n";
import { formatTime, formatDayShort } from "@/lib/datetime";

function Side({
  name,
  abbr,
  logo,
  align = "left",
  dim = false,
}: {
  name: string;
  abbr: string;
  logo?: string;
  align?: "left" | "right";
  dim?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamFlag abbr={abbr} logo={logo} name={name} size={30} className="shrink-0" />
      <span
        className={`min-w-0 truncate text-sm font-semibold ${
          dim ? "text-slate-400" : "text-white"
        }`}
      >
        {trCountry(name)}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  showGroup = true,
}: {
  match: Match;
  showGroup?: boolean;
}) {
  const { home, away, status } = match;
  const hasScore = status === "in" || status === "post";
  const homeWin = (home.score ?? 0) > (away.score ?? 0);
  const awayWin = (away.score ?? 0) > (home.score ?? 0);

  return (
    <Link
      href={`/maclar/${match.id}`}
      className="group block rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-emerald-500/40 hover:bg-white/[0.06]"
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="truncate">
          {match.roundLabel}
          {showGroup && match.group && match.stage !== "group"
            ? ` · Grup ${match.group}`
            : ""}
        </span>
        {status === "in" ? (
          <LiveBadge />
        ) : status === "post" ? (
          <Pill tone="slate">{match.statusDetail || "Bitti"}</Pill>
        ) : (
          <span className="shrink-0 font-medium text-slate-400">
            {formatDayShort(match.date)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Side
          name={home.name}
          abbr={home.abbr}
          logo={home.logo}
          dim={hasScore && awayWin}
        />

        <div className="shrink-0 px-1 text-center">
          {hasScore ? (
            <div className="flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums">
              <span className={homeWin ? "text-white" : "text-slate-400"}>
                {home.score ?? 0}
              </span>
              <span className="text-slate-600">-</span>
              <span className={awayWin ? "text-white" : "text-slate-400"}>
                {away.score ?? 0}
              </span>
            </div>
          ) : (
            <div className="text-base font-bold text-emerald-300">
              {formatTime(match.date)}
            </div>
          )}
          {home.shootoutScore != null && away.shootoutScore != null && (
            <div className="text-[10px] font-semibold text-amber-300">
              P: {home.shootoutScore}-{away.shootoutScore}
            </div>
          )}
          {status === "in" && match.clock && (
            <div className="text-[10px] font-semibold text-red-300">
              {match.clock}
            </div>
          )}
        </div>

        <Side
          name={away.name}
          abbr={away.abbr}
          logo={away.logo}
          align="right"
          dim={hasScore && homeWin}
        />
      </div>

      {(match.venue.name || match.venue.city) && (
        <div className="mt-2 truncate text-center text-[11px] text-slate-500">
          {[match.venue.name, match.venue.city].filter(Boolean).join(" · ")}
        </div>
      )}
      {match.broadcasts && match.broadcasts.length > 0 && (
        <div className="mt-1 truncate text-center text-[11px] text-slate-500">
          📺 {match.broadcasts.slice(0, 3).join(", ")}
        </div>
      )}
    </Link>
  );
}
