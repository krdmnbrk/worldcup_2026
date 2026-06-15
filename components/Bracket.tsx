import Link from "next/link";
import type { BracketData } from "@/lib/data";
import type { BracketRound, BracketSlot } from "@/lib/domain/types";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";

const ROUND_LABEL: Record<BracketRound, string> = {
  R32: "Son 32",
  R16: "Son 16",
  QF: "Çeyrek Final",
  SF: "Yarı Final",
  "3RD": "Üçüncülük",
  F: "Final",
};
const ORDER: BracketRound[] = ["R32", "R16", "QF", "SF", "F", "3RD"];

function SlotSide({
  slot,
  side,
}: {
  slot: BracketSlot;
  side: "home" | "away";
}) {
  const s = slot[side];
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {s.team ? (
          <>
            <TeamFlag
              abbr={s.team.abbr}
              logo={s.team.logo}
              name={s.team.name}
              size={18}
            />
            <span className="truncate text-xs font-medium text-white">
              {trCountry(s.team.name)}
            </span>
          </>
        ) : (
          <span className="truncate text-xs text-slate-500">
            {s.placeholder || "—"}
          </span>
        )}
      </div>
      {s.score != null && (
        <span className="font-mono text-xs font-bold text-slate-200">
          {s.score}
          {s.shootout != null && (
            <span className="text-[9px] font-semibold text-amber-300">
              {" "}
              ({s.shootout})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function SlotCard({ slot }: { slot: BracketSlot }) {
  const inner = (
    <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03]">
      <SlotSide slot={slot} side="home" />
      <SlotSide slot={slot} side="away" />
    </div>
  );
  return slot.matchId ? (
    <Link href={`/maclar/${slot.matchId}`} className="block hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Bracket({ data }: { data: BracketData }) {
  const byRound = (r: BracketRound) =>
    data.bracket.slots.filter((s) => s.round === r);

  return (
    <div>
      <p className="mb-2 text-center text-[11px] text-slate-500 sm:hidden">
        ← yatay kaydırarak gez →
      </p>
      <div className="x-scroll overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
        {ORDER.map((round) => {
          const slots = byRound(round);
          if (!slots.length) return null;
          return (
            <div key={round} className="w-44 shrink-0">
              <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-emerald-300">
                {ROUND_LABEL[round]}
              </h3>
              <div className="flex h-full flex-col justify-around gap-2">
                {slots.map((s) => (
                  <SlotCard key={s.id} slot={s} />
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
