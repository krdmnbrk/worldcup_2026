"use client";

import { useEspnPoll } from "@/components/useEspnPoll";
import { browserAllMatches } from "@/lib/espn/browser";
import { MatchList } from "@/components/MatchList";
import { EmptyState } from "@/components/ui";
import { istanbulDayKey } from "@/lib/datetime";
import type { Match } from "@/lib/domain/types";

// Ana sayfadaki "Canlı ve Bugün" bölümü — tarayıcıda dakikada bir tazelenir.
export function LiveTodayMatches({ initial }: { initial: Match[] }) {
  const { data, updatedAt } = useEspnPoll(
    browserAllMatches,
    60000,
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
    <MatchList matches={list} groupByDay={false} liveAnchorMs={updatedAt} />
  );
}
