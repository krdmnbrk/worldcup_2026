// Türkiye'ye özel sayfa: takım + kadro + fikstür/sonuç + grup durumu + golcüler.

import { espnFetch } from "@/lib/espn/client";
import { endpoints } from "@/lib/espn/endpoints";
import { normalizeRoster } from "@/lib/espn/normalize";
import { withSnapshot } from "@/lib/snapshot";
import type {
  Team,
  Player,
  StatLeader,
  DataResult,
} from "@/lib/domain/types";
import {
  byDate,
  computeForm,
  fetchAllMatches,
  fetchStandings,
  fetchTeamsList,
  teamStandingSummary,
} from "@/lib/data/fetchers";
import type { TeamPage } from "@/lib/data/teams";

export function findTurkiyeId(teams: Team[]): string | undefined {
  const t = teams.find(
    (x) => x.abbr.toUpperCase() === "TUR" || /t[üu]rkiye|turkey/i.test(x.name),
  );
  return t?.id;
}

export interface TurkiyePage extends TeamPage {
  topScorers: StatLeader[];
}

export function getTurkiye(): Promise<DataResult<TurkiyePage | null>> {
  return withSnapshot("turkiye", async () => {
    const teams = await fetchTeamsList();
    const id = findTurkiyeId(teams);
    if (!id) return null;

    const [rosterJson, allMatches, standings] = await Promise.all([
      espnFetch<unknown>(endpoints.roster(id), { revalidate: 43200 }).catch(
        () => null,
      ),
      fetchAllMatches(),
      fetchStandings(),
    ]);
    const team: Team =
      teams.find((t) => t.id === id) ??
      { id, name: "Türkiye", abbr: "TUR", logo: "" };
    const squad = rosterJson ? normalizeRoster(rosterJson, team) : [];
    const matches = allMatches
      .filter((m) => m.home.id === id || m.away.id === id)
      .sort(byDate);
    const groupStanding = standings.find((g) =>
      g.rows.some((r) => r.team.id === id),
    );

    // Türkiye golcüleri (maç olaylarından)
    const squadById = new Map<string, Player>();
    for (const p of squad) if (p.id) squadById.set(p.id, p);
    const scorer = new Map<string, StatLeader>();
    for (const m of matches) {
      for (const e of m.events) {
        if (
          (e.type === "goal" || e.type === "penalty") &&
          e.teamId === id &&
          e.player
        ) {
          const key = e.playerId || e.player;
          const cur = scorer.get(key) || {
            id: e.playerId || key,
            name: e.player,
            teamId: id,
            value: 0,
            headshot: e.playerId
              ? squadById.get(e.playerId)?.headshot
              : undefined,
          };
          cur.value += 1;
          scorer.set(key, cur);
        }
      }
    }
    const topScorers = Array.from(scorer.values()).sort(
      (a, b) => b.value - a.value,
    );

    return {
      team,
      standingSummary: teamStandingSummary(groupStanding, id),
      groupId: team.groupId ?? groupStanding?.groupId,
      squad,
      matches,
      groupStanding,
      topScorers,
      form: computeForm(matches, id),
    };
  });
}
