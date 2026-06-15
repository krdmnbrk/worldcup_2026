// Takım listesi + tek takım sayfası (kadro, fikstür/sonuçlar, form, grup durumu).

import { espnFetch } from "@/lib/espn/client";
import { endpoints } from "@/lib/espn/endpoints";
import { normalizeRoster } from "@/lib/espn/normalize";
import { withSnapshot } from "@/lib/snapshot";
import type {
  Match,
  GroupStanding,
  Team,
  Player,
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

export interface TeamPage {
  team: Team;
  standingSummary?: string;
  groupId?: string;
  squad: Player[];
  matches: Match[];
  groupStanding?: GroupStanding;
  form: string[]; // son 5 maç (en yeni başta): "W"|"D"|"L"
}

export function getTeams(): Promise<DataResult<Team[]>> {
  return withSnapshot("teams", fetchTeamsList, { isValid: (d) => d.length > 0 });
}

export function getTeamPage(teamId: string): Promise<DataResult<TeamPage>> {
  return withSnapshot(`team-${teamId}`, async () => {
    const [teams, rosterJson, allMatches, standings] = await Promise.all([
      fetchTeamsList(),
      espnFetch<unknown>(endpoints.roster(teamId), { revalidate: 43200 }).catch(
        () => null,
      ),
      fetchAllMatches(),
      fetchStandings(),
    ]);
    const team: Team =
      teams.find((t) => t.id === teamId) ??
      { id: teamId, name: "Takım", abbr: "", logo: "" };
    const squad = rosterJson ? normalizeRoster(rosterJson, team) : [];
    const matches = allMatches
      .filter((m) => m.home.id === teamId || m.away.id === teamId)
      .sort(byDate);
    const groupStanding = standings.find((g) =>
      g.rows.some((r) => r.team.id === teamId),
    );
    return {
      team,
      standingSummary: teamStandingSummary(groupStanding, teamId),
      groupId: team.groupId ?? groupStanding?.groupId,
      squad,
      matches,
      groupStanding,
      form: computeForm(matches, teamId),
    };
  });
}
