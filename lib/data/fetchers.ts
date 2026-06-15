// Paylaşılan ham çekiciler ve küçük yardımcılar. DataResult sarmalı YOK — Next
// fetch önbelleği sayesinde ucuz; üst seviye get* fonksiyonları bunları sarar.

import { espnFetch } from "@/lib/espn/client";
import { endpoints, TOURNAMENT_CHUNKS } from "@/lib/espn/endpoints";
import {
  normalizeScoreboard,
  normalizeStandings,
  normalizeStandingsFallback,
  normalizeTeams,
  normalizeRoster,
} from "@/lib/espn/normalize";
import type { Match, GroupStanding, Team, Player } from "@/lib/domain/types";

export const byDate = (a: Match, b: Match) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

export async function fetchAllMatches(): Promise<Match[]> {
  const results = await Promise.all(
    TOURNAMENT_CHUNKS.map((c) =>
      espnFetch<unknown>(endpoints.scoreboard(c), {
        revalidate: 60,
        tags: ["matches"],
      })
        .then(normalizeScoreboard)
        .catch(() => [] as Match[]),
    ),
  );
  const byId = new Map<string, Match>();
  for (const m of results.flat()) byId.set(m.id, m);
  return Array.from(byId.values()).sort(byDate);
}

export async function fetchStandings(): Promise<GroupStanding[]> {
  let groups: GroupStanding[] = [];
  try {
    groups = normalizeStandings(
      await espnFetch<unknown>(endpoints.standings(), {
        revalidate: 120,
        tags: ["standings"],
      }),
    );
  } catch {
    groups = [];
  }
  if (!groups.length) {
    try {
      groups = normalizeStandingsFallback(
        await espnFetch<unknown>(endpoints.standingsFallback(), {
          revalidate: 120,
        }),
      );
    } catch {
      groups = [];
    }
  }
  return groups;
}

export async function fetchTeamsList(): Promise<Team[]> {
  const [teamsJson, standings] = await Promise.all([
    espnFetch<unknown>(endpoints.teams(), {
      revalidate: 21600,
      tags: ["teams"],
    }),
    fetchStandings(),
  ]);
  let teams = normalizeTeams(teamsJson);
  const groupOf = new Map<string, string>();
  for (const g of standings)
    for (const r of g.rows) groupOf.set(r.team.id, g.groupId);
  teams = teams.map((t) => ({ ...t, groupId: groupOf.get(t.id) }));
  const inTournament = new Set(groupOf.keys());
  if (inTournament.size) teams = teams.filter((t) => inTournament.has(t.id));
  return teams.sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

// Tüm kadroların (48 takım) birleşik oyuncu dizini — statik derlemede oyuncu
// sayfalarını oyuncu başına ekstra çağrı yapmadan üretmek için.
export async function fetchPlayerIndex(): Promise<Player[]> {
  const teams = await fetchTeamsList();
  const rosters = await Promise.all(
    teams.map((t) =>
      espnFetch<unknown>(endpoints.roster(t.id), {
        revalidate: 43200,
        tags: ["rosters"],
      })
        .then((j) => normalizeRoster(j, t))
        .catch(() => [] as Player[]),
    ),
  );
  const map = new Map<string, Player>();
  for (const p of rosters.flat()) if (p.id) map.set(p.id, p);
  return Array.from(map.values());
}

// ---- takım sayfası ortak yardımcıları (teams + turkiye paylaşır) ----

export function teamStandingSummary(
  g?: GroupStanding,
  teamId?: string,
): string | undefined {
  const row = g?.rows.find((r) => r.team.id === teamId);
  return row
    ? `Grup ${g!.groupId} · ${row.rank}. sıra · ${row.points} puan`
    : undefined;
}

// Takımın oynanmış son 5 maçından form (en yeni başta)
export function computeForm(matches: Match[], teamId: string): string[] {
  return matches
    .filter((m) => m.status === "post")
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5)
    .map((m) => {
      const isHome = m.home.id === teamId;
      const gf = (isHome ? m.home.score : m.away.score) ?? 0;
      const ga = (isHome ? m.away.score : m.home.score) ?? 0;
      return gf > ga ? "W" : gf < ga ? "L" : "D";
    });
}
