import Link from "next/link";
import type { Player } from "@/lib/domain/types";
import { PlayerImage } from "@/components/PlayerImage";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/oyuncular/${player.id}`}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:border-emerald-500/40 hover:bg-white/[0.06]"
    >
      <PlayerImage
        id={player.id}
        src={player.headshot}
        name={player.name}
        size={44}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {player.name}
        </p>
        <p className="truncate text-xs text-slate-400">
          {[player.jersey ? `#${player.jersey}` : null, player.position]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
    </Link>
  );
}
