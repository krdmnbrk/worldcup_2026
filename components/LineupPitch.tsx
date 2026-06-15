import Link from "next/link";
import type {
  TeamLineup,
  LineupPlayer,
  PlayerMatchStat,
} from "@/lib/domain/types";
import { PlayerImage } from "@/components/PlayerImage";

type Cat = "GK" | "DEF" | "MID" | "FWD";

// Oyuncunun maçtaki öne çıkan katkıları (gol/asist/kart) küçük rozetler
function StatBadges({ s }: { s?: PlayerMatchStat }) {
  if (!s) return null;
  const parts: string[] = [];
  if (s.goals > 0) parts.push(s.goals > 1 ? `⚽×${s.goals}` : "⚽");
  if (s.assists > 0) parts.push(s.assists > 1 ? `🅰×${s.assists}` : "🅰");
  if (s.red) parts.push("🟥");
  else if (s.yellow) parts.push("🟨");
  if (!parts.length) return null;
  return (
    <span className="whitespace-nowrap text-[10px] leading-none">
      {parts.join(" ")}
    </span>
  );
}

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

const CAT_RING: Record<Cat, string> = {
  GK: "ring-amber-400",
  DEF: "ring-sky-400",
  MID: "ring-emerald-400",
  FWD: "ring-red-400",
};

function PlayerDot({ p, cat }: { p: LineupPlayer; cat: Cat }) {
  const last = p.name.split(/\s+/).slice(-1)[0];
  return (
    <Link
      href={`/oyuncular/${p.athleteId}`}
      className="group flex w-16 flex-col items-center gap-1"
      title={p.name}
    >
      <span
        className={`relative grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-emerald-900 ring-2 ${CAT_RING[cat]} group-hover:ring-white`}
      >
        {p.jersey || "•"}
        {p.captain && (
          <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-yellow-400 text-[8px] font-bold text-black ring-1 ring-black/50">
            C
          </span>
        )}
      </span>
      <span className="max-w-full truncate rounded bg-black/40 px-1 text-[10px] font-medium text-white">
        {last}
      </span>
      <StatBadges s={p.stats} />
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
                  <PlayerDot key={p.athleteId} p={p} cat={cat} />
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

      {hasStarters && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-amber-400" />{" "}
            Kaleci
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-sky-400" />{" "}
            Defans
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-emerald-400" />{" "}
            Orta saha
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-red-400" />{" "}
            Forvet
          </span>
          <span className="flex items-center gap-1">
            <span className="grid h-3 w-3 place-items-center rounded-full bg-yellow-400 text-[7px] font-bold text-black">
              C
            </span>{" "}
            Kaptan
          </span>
        </div>
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
                {p.captain && (
                  <span className="text-[10px] font-bold text-yellow-400">(K)</span>
                )}
                <StatBadges s={p.stats} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
