"use client";

import { useCallback } from "react";
import { useEspnPoll } from "@/components/useEspnPoll";
import { DataFreshness } from "@/components/DataFreshness";
import { browserMergeLiveInto } from "@/lib/espn/browser";
import { MatchList } from "@/components/MatchList";
import { EmptyState } from "@/components/ui";
import { istanbulDayKey } from "@/lib/datetime";
import { liveRefreshMs } from "@/components/useEspnPoll";
import type { Match } from "@/lib/domain/types";

const interval = (ms: Match[]) => liveRefreshMs(ms.some((m) => m.status === "in"));

// Ana sayfadaki "Canlı ve Bugün" bölümü — tarayıcıda tazelenir. Canlı maç oynanırken
// daha sık, dururken daha seyrek çeker; ayrıca 6 dilim yerine tek istek bindirir.
export function LiveTodayMatches({ initial }: { initial: Match[] }) {
  const fetcher = useCallback(() => browserMergeLiveInto(initial), [initial]);
  const { data, updatedAt, error } = useEspnPoll(
    fetcher,
    interval,
    initial,
    true,
    true,
  );
  const todayKey = istanbulDayKey(new Date().toISOString());
  const list = data
    .filter((m) => m.status === "in" || istanbulDayKey(m.date) === todayKey)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  if (!list.length)
    return (
      <EmptyState
        title="Bugün maç yok."
        hint="Yaklaşan maçlar için fikstüre göz atın."
      />
    );
  return (
    <div className="space-y-2">
      <div className="flex justify-end text-xs">
        <DataFreshness updatedAt={updatedAt} error={error} />
      </div>
      <MatchList matches={list} groupByDay={false} liveAnchorMs={updatedAt} />
    </div>
  );
}
