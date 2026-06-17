import Link from "next/link";
import { CircleDot, Tv, ArrowLeftRight } from "lucide-react";
import type { ReactNode } from "react";
import type { MatchEvent, EventType } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui";

const ICONS: Record<EventType, ReactNode> = {
  goal: <CircleDot className="h-4 w-4 text-emerald-400" aria-hidden />,
  penalty: <CircleDot className="h-4 w-4 text-emerald-400" aria-hidden />,
  "own-goal": <CircleDot className="h-4 w-4 text-red-400" aria-hidden />,
  yellow: (
    <span
      className="inline-block h-4 w-3 rounded-[2px] bg-yellow-400"
      aria-label="Sarı kart"
    />
  ),
  red: (
    <span
      className="inline-block h-4 w-3 rounded-[2px] bg-red-500"
      aria-label="Kırmızı kart"
    />
  ),
  sub: <ArrowLeftRight className="h-4 w-4 text-indigo-300" aria-hidden />,
  var: <Tv className="h-4 w-4 text-slate-300" aria-hidden />,
  other: "•",
};

function eventNote(e: MatchEvent): string {
  if (e.type === "penalty") return "Penaltı";
  if (e.type === "own-goal") return "Kendi kalesine";
  if (e.type === "sub") return "Değişiklik";
  if (e.type === "var") return "VAR";
  return "";
}

export function KeyMomentsTimeline({
  events,
  homeId,
}: {
  events: MatchEvent[];
  homeId: string;
}) {
  const shown = events.filter((e) => e.type !== "other");
  if (!shown.length)
    return (
      <EmptyState
        title="Bu maç için kritik an verisi yok."
        hint="Goller, kartlar ve değişiklikler burada görünür."
      />
    );

  return (
    <ol className="relative space-y-3 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-white/10">
      {shown.map((e, i) => {
        const isHome = e.teamId === homeId;
        const note = eventNote(e);
        const body = (
          <div
            className={`flex max-w-[46%] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 ${
              isHome ? "flex-row" : "flex-row-reverse text-right"
            }`}
          >
            <span className="text-base leading-none">{ICONS[e.type]}</span>
            <div className="min-w-0">
              {e.playerId ? (
                <Link
                  href={`/oyuncular/${e.playerId}`}
                  className="block truncate text-sm font-semibold text-white hover:text-amber-300"
                >
                  {e.player || "—"}
                </Link>
              ) : (
                <p className="truncate text-sm font-semibold text-white">
                  {e.player || "—"}
                </p>
              )}
              {note && (
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {note}
                </p>
              )}
            </div>
          </div>
        );
        return (
          <li
            key={i}
            className={`relative flex items-center ${
              isHome ? "justify-start" : "justify-end"
            }`}
          >
            {isHome && body}
            <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-black">
              {e.minute || "·"}
            </span>
            {!isHome && body}
          </li>
        );
      })}
    </ol>
  );
}
