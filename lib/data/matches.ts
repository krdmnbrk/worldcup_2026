// Maç listesi + tek maç detayı (kadro, diziliş, özet istatistikleri).

import { espnFetch } from "@/lib/espn/client";
import { endpoints } from "@/lib/espn/endpoints";
import { normalizeSummary, normalizeFormation } from "@/lib/espn/normalize";
import { withSnapshot } from "@/lib/snapshot";
import { coachFor } from "@/data/coaches";
import type {
  Match,
  MatchDetail,
  TeamLineup,
  DataResult,
} from "@/lib/domain/types";
import { fetchAllMatches } from "@/lib/data/fetchers";

export function getAllMatches(): Promise<DataResult<Match[]>> {
  return withSnapshot("matches", fetchAllMatches, {
    isValid: (d) => d.length > 0,
  });
}

export function getMatchDetail(id: string): Promise<DataResult<MatchDetail>> {
  return withSnapshot(`match-${id}`, async () => {
    const all = await fetchAllMatches();
    const match = all.find((m) => m.id === id);
    const summaryJson = await espnFetch<unknown>(endpoints.summary(id), {
      revalidate: match?.status === "post" ? 3600 : 30,
      tags: [`match-${id}`],
    });
    const sum = normalizeSummary(summaryJson);

    // diziliş (core API) + antrenör (statik)
    await Promise.all(
      sum.lineups.map(async (lu) => {
        try {
          const f = await espnFetch<unknown>(
            endpoints.formation(id, lu.teamId),
            { revalidate: 3600 },
          );
          lu.formation = normalizeFormation(f);
        } catch {
          /* diziliş yoksa boş geç */
        }
        lu.coach = coachFor(lu.teamId);
      }),
    );

    // [ev, deplasman] sırasına diz
    let lineups: TeamLineup[] = sum.lineups;
    if (match) {
      const ordered = [
        sum.lineups.find((l) => l.teamId === match.home.id),
        sum.lineups.find((l) => l.teamId === match.away.id),
      ].filter(Boolean) as TeamLineup[];
      if (ordered.length === sum.lineups.length && ordered.length > 0)
        lineups = ordered;
    }

    const detail: MatchDetail = {
      match:
        match ??
        ({
          id,
          date: "",
          status: "post",
          completed: true,
          stage: "unknown",
          roundLabel: "Maç",
          venue: {},
          home: {
            id: lineups[0]?.teamId ?? "",
            name: "—",
            abbr: "",
            logo: "",
            homeAway: "home",
          },
          away: {
            id: lineups[1]?.teamId ?? "",
            name: "—",
            abbr: "",
            logo: "",
            homeAway: "away",
          },
          events: [],
        } as Match),
      lineups,
      teamStats: sum.teamStats,
      referee: sum.referee,
      attendance: sum.attendance ?? match?.attendance,
    };
    return detail;
  });
}
