"use client";

import { useEffect, useState } from "react";
import { browserAthlete } from "@/lib/espn/browser";
import { Card, SectionTitle } from "@/components/ui";
import type { Player } from "@/lib/domain/types";

// Oyuncunun güncel kulübü ve sezon istatistiklerini tarayıcıda ESPN'den çeker
// (statik derlemede yer almaz; istemcide zenginleştirilir).
export function PlayerBioLive({ id }: { id: string }) {
  const [p, setP] = useState<Player | null>(null);

  useEffect(() => {
    let cancelled = false;
    browserAthlete(id).then((r) => {
      if (!cancelled) setP(r);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasStats = p?.seasonStats && p.seasonStats.length > 0;
  if (!p || (!p.club && !hasStats)) return null;

  return (
    <section>
      <SectionTitle title="Kulüp & Sezon" subtitle="Güncel kulüp istatistikleri" />
      <Card className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
        {p.club && (
          <div>
            <dt className="text-xs text-slate-500">Kulüp</dt>
            <dd className="text-sm font-semibold text-white">{p.club}</dd>
          </div>
        )}
        {p.seasonStats?.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-slate-500">{s.label}</dt>
            <dd className="text-sm font-semibold text-white">{s.value}</dd>
          </div>
        ))}
      </Card>
    </section>
  );
}
