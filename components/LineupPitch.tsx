import Link from "next/link";
import type { TeamLineup, LineupPlayer } from "@/lib/domain/types";
import { PlayerImage } from "@/components/PlayerImage";

type Cat = "GK" | "DEF" | "MID" | "FWD";

function categorize(pos?: string): Cat {
  const p = (pos || "").toUpperCase();
  if (p.startsWith("G")) return "GK";
  if (/(B|D)$/.test(p) || p.includes("D")) {
    if (p.includes("M")) return "MID";
    return "DEF";
  }
  if (p.startsWith("F") || p.includes("ST") || p.includes("W") || p.includes("CF"))
    return "FWD";
  if (p.includes("M")) return "MID";
  return "MID";
}

function PlayerDot({ p }: { p: LineupPlayer }) {
  const last = p.name.split(/\s+/).slice(-1)[0];
  return (
    <Link
      href={`/oyuncular/${p.athleteId}`}
      className="group flex w-16 flex-col items-center gap-1"
      title={p.name}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-emerald-900 ring-2 ring-emerald-900/40 group-hover:ring-white">
        {p.jersey || "•"}
      </span>
      <span className="max-w-full truncate rounded bg-black/40 px-1 text-[10px] font-medium text-white">
        {last}
      </span>
    </Link>
  );
}

export function LineupPitch({ lineup }: { lineup: TeamLineup }) {
  const rows: Record<Cat, LineupPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of lineup.starters) rows[categorize(p.position)].push(p);

  const hasStarters = lineup.starters.length > 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          Diziliş:{" "}
          <span className="font-semibold text-white">
            {lineup.formation || "—"}
          </span>
        </span>
        <span>
          T. Direktör:{" "}
          <span className="font-semibold text-white">
            {lineup.coach || "Bilinmiyor"}
          </span>
        </span>
      </div>

      {hasStarters ? (
        <div className="pitch-bg space-y-3 rounded-xl border border-emerald-900/50 p-3">
          {(["FWD", "MID", "DEF", "GK"] as Cat[]).map((cat) =>
            rows[cat].length ? (
              <div key={cat} className="flex flex-wrap justify-center gap-2">
                {rows[cat].map((p) => (
                  <PlayerDot key={p.athleteId} p={p} />
                ))}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-slate-400">
          İlk 11 verisi bulunamadı.
        </p>
      )}

      {lineup.subs.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Yedekler
          </h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {lineup.subs.map((p) => (
              <Link
                key={p.athleteId}
                href={`/oyuncular/${p.athleteId}`}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <PlayerImage id={p.athleteId} src={p.headshot} name={p.name} size={22} />
                <span className="text-xs text-slate-500">{p.jersey}</span>
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
