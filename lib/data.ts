// Üst seviye veri katmanı: ESPN istemci + normalize'ı birleştirir, önbellekler,
// snapshot ile yedekler ve turnuva geneli toplamları (istatistik, eleme) hesaplar.

import { espnFetch } from "@/lib/espn/client";
import { endpoints } from "@/lib/espn/endpoints";
import {
  normalizeScoreboard,
  normalizeSummary,
  normalizeFormation,
  normalizeStandings,
  normalizeStandingsFallback,
  normalizeTeams,
  normalizeRoster,
} from "@/lib/espn/normalize";
import { withSnapshot } from "@/lib/snapshot";
import { coachFor } from "@/data/coaches";
import type {
  Match,
  MatchDetail,
  GroupStanding,
  Team,
  Player,
  TeamLineup,
  TournamentStats,
  StatLeader,
  TeamGoalCount,
  MatchEvent,
  StandingRow,
  Bracket,
  BracketSlot,
  BracketRound,
  DataResult,
} from "@/lib/domain/types";

// Turnuva 11 Haziran – 19 Temmuz 2026. Skorbord tarih-pencereli olduğundan
// haftalık dilimler halinde taranır ve id'ye göre birleştirilir.
const MATCH_CHUNKS = [
  "20260611-20260617",
  "20260618-20260624",
  "20260625-20260701",
  "20260702-20260708",
  "20260709-20260715",
  "20260716-20260719",
];

const byDate = (a: Match, b: Match) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

// ---- ham (DataResult'sız) çekiciler; Next fetch önbelleği sayesinde ucuz ----

async function fetchAllMatches(): Promise<Match[]> {
  const results = await Promise.all(
    MATCH_CHUNKS.map((c) =>
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

async function fetchStandings(): Promise<GroupStanding[]> {
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

async function fetchTeamsList(): Promise<Team[]> {
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

// ---- genel API (DataResult sarmalı) ----

export function getAllMatches(): Promise<DataResult<Match[]>> {
  return withSnapshot("matches", fetchAllMatches, {
    isValid: (d) => d.length > 0,
  });
}

export function getStandings(): Promise<DataResult<GroupStanding[]>> {
  return withSnapshot("standings", fetchStandings, {
    isValid: (d) => d.length > 0,
  });
}

export function getTeams(): Promise<DataResult<Team[]>> {
  return withSnapshot("teams", fetchTeamsList, { isValid: (d) => d.length > 0 });
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

// ---- takım sayfası ----
export interface TeamPage {
  team: Team;
  standingSummary?: string;
  groupId?: string;
  squad: Player[];
  matches: Match[];
  groupStanding?: GroupStanding;
}

function teamStandingSummary(g?: GroupStanding, teamId?: string): string | undefined {
  const row = g?.rows.find((r) => r.team.id === teamId);
  return row ? `Grup ${g!.groupId} · ${row.rank}. sıra · ${row.points} puan` : undefined;
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
    };
  });
}

// ---- oyuncu sayfası ----
export interface PlayerContribution {
  match: Match;
  events: MatchEvent[];
}
export interface PlayerPage {
  player: Player;
  goals: number;
  penalties: number;
  ownGoals: number;
  yellow: number;
  red: number;
  appearances: PlayerContribution[];
}

// Tüm kadroların (48 takım) birleşik oyuncu dizini — statik derlemede oyuncu
// sayfalarını oyuncu başına ekstra çağrı yapmadan üretmek için.
async function fetchPlayerIndex(): Promise<Player[]> {
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

export function getPlayerIndex(): Promise<DataResult<Player[]>> {
  return withSnapshot("player-index", fetchPlayerIndex, {
    isValid: (d) => d.length > 0,
  });
}

export function getPlayer(athleteId: string): Promise<DataResult<PlayerPage>> {
  return withSnapshot(`player-${athleteId}`, async () => {
    const [index, allMatches] = await Promise.all([
      fetchPlayerIndex(),
      fetchAllMatches(),
    ]);
    const base = index.find((p) => p.id === athleteId);
    // Kadroda olmayan ama maç olaylarında geçen oyuncu için ismi olaydan al
    const evName = base
      ? undefined
      : allMatches
          .flatMap((m) => m.events)
          .find((e) => e.playerId === athleteId && e.player)?.player;
    const player: Player = base ?? { id: athleteId, name: evName ?? "Oyuncu" };

    let goals = 0,
      penalties = 0,
      ownGoals = 0,
      yellow = 0,
      red = 0;
    const appearances: PlayerContribution[] = [];
    for (const m of allMatches) {
      const evs = m.events.filter((e) => e.playerId === athleteId);
      if (!evs.length) continue;
      appearances.push({ match: m, events: evs });
      for (const e of evs) {
        if (e.type === "goal") goals++;
        else if (e.type === "penalty") {
          goals++;
          penalties++;
        } else if (e.type === "own-goal") ownGoals++;
        else if (e.type === "yellow") yellow++;
        else if (e.type === "red") red++;
      }
    }
    appearances.sort((a, b) => byDate(a.match, b.match));
    return { player, goals, penalties, ownGoals, yellow, red, appearances };
  });
}

// ---- turnuva geneli istatistikler (maçlardan hesaplanır) ----

function teamLookup(matches: Match[]) {
  const map = new Map<string, { name: string; abbr: string; logo: string }>();
  for (const m of matches) {
    for (const t of [m.home, m.away])
      if (t.id) map.set(t.id, { name: t.name, abbr: t.abbr, logo: t.logo });
  }
  return map;
}

export function getTournamentStats(): Promise<DataResult<TournamentStats>> {
  return withSnapshot(
    "stats",
    async () => {
      const [matches, playerIndex] = await Promise.all([
        fetchAllMatches(),
        fetchPlayerIndex().catch(() => [] as Player[]),
      ]);
      const indexMap = new Map<string, Player>();
      for (const p of playerIndex) if (p.id) indexMap.set(p.id, p);
      const teams = teamLookup(matches);
      const played = matches.filter(
        (m) => m.status === "post" || m.status === "in",
      );

      // gol krallığı (penaltı dahil, kendi kalesine hariç) — playerId bazlı
      const scorerMap = new Map<string, StatLeader>();
      const carded = new Map<string, StatLeader>();
      let yellowCards = 0,
        redCards = 0;

      for (const m of matches) {
        for (const e of m.events) {
          const t = e.teamId ? teams.get(e.teamId) : undefined;
          if ((e.type === "goal" || e.type === "penalty") && e.player) {
            const key = e.playerId || `${e.player}-${e.teamId}`;
            const cur = scorerMap.get(key) || {
              id: e.playerId || key,
              name: e.player,
              teamId: e.teamId,
              teamAbbr: t?.abbr,
              teamName: t?.name,
              headshot: e.playerId ? indexMap.get(e.playerId)?.headshot : undefined,
              value: 0,
            };
            cur.value += 1;
            scorerMap.set(key, cur);
          }
          if (e.type === "yellow") yellowCards++;
          if (e.type === "red") redCards++;
          if ((e.type === "yellow" || e.type === "red") && e.player) {
            const key = e.playerId || `${e.player}-${e.teamId}`;
            const cur = carded.get(key) || {
              id: e.playerId || key,
              name: e.player,
              teamId: e.teamId,
              teamAbbr: t?.abbr,
              teamName: t?.name,
              headshot: e.playerId ? indexMap.get(e.playerId)?.headshot : undefined,
              value: 0,
            };
            cur.value += 1;
            carded.set(key, cur);
          }
        }
      }

      // takım golleri — maç skorlarından (güvenilir)
      const teamGoalMap = new Map<string, TeamGoalCount>();
      const concededZero = new Map<string, number>();
      let totalGoals = 0;
      let biggest: { match: Match; margin: number } | undefined;

      for (const m of played) {
        const hs = m.home.score ?? 0;
        const as = m.away.score ?? 0;
        const add = (t: typeof m.home, goals: number) => {
          if (!t.id) return;
          const cur = teamGoalMap.get(t.id) || {
            teamId: t.id,
            teamName: t.name,
            teamAbbr: t.abbr,
            logo: t.logo,
            value: 0,
          };
          cur.value += goals;
          teamGoalMap.set(t.id, cur);
        };
        add(m.home, hs);
        add(m.away, as);
        if (m.status === "post") {
          totalGoals += hs + as;
          if (as === 0)
            concededZero.set(m.home.id, (concededZero.get(m.home.id) || 0) + 1);
          if (hs === 0)
            concededZero.set(m.away.id, (concededZero.get(m.away.id) || 0) + 1);
          const margin = Math.abs(hs - as);
          if (!biggest || margin > biggest.margin) biggest = { match: m, margin };
        }
      }

      const playedCount = played.filter((m) => m.status === "post").length;
      const cleanSheetTeams: TeamGoalCount[] = Array.from(concededZero.entries())
        .map(([id, v]) => {
          const t = teams.get(id);
          return {
            teamId: id,
            teamName: t?.name || "—",
            teamAbbr: t?.abbr || "",
            logo: t?.logo || "",
            value: v,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      const topScorers = Array.from(scorerMap.values())
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .slice(0, 12);
      const teamGoals = Array.from(teamGoalMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);
      const topCarded = Array.from(carded.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      return {
        topScorers,
        teamGoals,
        topCarded,
        yellowCards,
        redCards,
        totalGoals,
        totalMatches: matches.length,
        playedMatches: playedCount,
        avgGoalsPerMatch: playedCount ? totalGoals / playedCount : 0,
        biggestWin: biggest,
        cleanSheetTeams,
      };
    },
    { isValid: (d) => d.totalMatches > 0 },
  );
}

// ---- eleme / kalifikasyon ----
export interface GroupQualifier {
  groupId: string;
  winner?: Team;
  runnerUp?: Team;
  third?: { team: Team; row: StandingRow };
  complete: boolean;
}
export interface ThirdPlaceRow {
  groupId: string;
  row: StandingRow;
  qualifies: boolean;
}
export interface Qualification {
  groups: GroupQualifier[];
  thirds: ThirdPlaceRow[];
  complete: boolean;
}

function computeQualification(standings: GroupStanding[]): Qualification {
  const groups: GroupQualifier[] = standings.map((g) => {
    const rows = g.rows;
    const complete = rows.every((r) => r.played >= 3) && rows.length >= 4;
    return {
      groupId: g.groupId,
      winner: rows[0]?.team,
      runnerUp: rows[1]?.team,
      third: rows[2] ? { team: rows[2].team, row: rows[2] } : undefined,
      complete,
    };
  });

  const thirdsRaw = standings
    .map((g) => (g.rows[2] ? { groupId: g.groupId, row: g.rows[2] } : null))
    .filter(Boolean) as { groupId: string; row: StandingRow }[];

  thirdsRaw.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd;
    if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf;
    return a.row.team.name.localeCompare(b.row.team.name);
  });

  const thirds: ThirdPlaceRow[] = thirdsRaw.map((t, i) => ({
    ...t,
    qualifies: i < 8,
  }));

  const complete =
    standings.length === 12 && groups.every((g) => g.complete);
  return { groups, thirds, complete };
}

export interface BracketData {
  bracket: Bracket;
  qualification: Qualification;
}

const ROUND_DEFS: { round: BracketRound; label: string; count: number }[] = [
  { round: "R32", label: "Son 32 Turu", count: 16 },
  { round: "R16", label: "Son 16 Turu", count: 8 },
  { round: "QF", label: "Çeyrek Final", count: 4 },
  { round: "SF", label: "Yarı Final", count: 2 },
  { round: "3RD", label: "Üçüncülük", count: 1 },
  { round: "F", label: "Final", count: 1 },
];

function stageToRound(stage: string): BracketRound | null {
  switch (stage) {
    case "r32":
      return "R32";
    case "r16":
      return "R16";
    case "qf":
      return "QF";
    case "sf":
      return "SF";
    case "third":
      return "3RD";
    case "final":
      return "F";
    default:
      return null;
  }
}

export function getBracket(): Promise<DataResult<BracketData>> {
  return withSnapshot("bracket", async () => {
    const [standings, allMatches] = await Promise.all([
      fetchStandings(),
      fetchAllMatches(),
    ]);
    const qualification = computeQualification(standings);

    const slots: BracketSlot[] = [];
    for (const def of ROUND_DEFS) {
      const real = allMatches.filter((m) => stageToRound(m.stage) === def.round);
      for (let i = 0; i < def.count; i++) {
        const m = real[i];
        if (m) {
          slots.push({
            id: `${def.round}-${i}`,
            round: def.round,
            matchId: m.id,
            status: m.status,
            date: m.date,
            home: { team: m.home, score: m.home.score },
            away: { team: m.away, score: m.away.score },
          });
        } else {
          slots.push({
            id: `${def.round}-${i}`,
            round: def.round,
            home: { placeholder: "?" },
            away: { placeholder: "?" },
          });
        }
      }
    }

    const provisional = !qualification.complete;
    const qualifiersKnown = allMatches.some(
      (m) => stageToRound(m.stage) !== null,
    );

    return {
      bracket: { slots, provisional, qualifiersKnown },
      qualification,
    };
  });
}

// ---- Türkiye ----
export function findTurkiyeId(teams: Team[]): string | undefined {
  const t = teams.find(
    (x) =>
      x.abbr.toUpperCase() === "TUR" ||
      /t[üu]rkiye|turkey/i.test(x.name),
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
            headshot: e.playerId ? squadById.get(e.playerId)?.headshot : undefined,
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
    };
  });
}
