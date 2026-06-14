/* eslint-disable @typescript-eslint/no-explicit-any */
// ESPN ham JSON → temiz domain tipleri. TÜM ESPN tuhaflıkları burada izole edilir.

import type {
  Match,
  MatchEvent,
  EventType,
  Stage,
  TeamInMatch,
  Team,
  TeamLineup,
  LineupPlayer,
  TeamMatchStat,
  GroupStanding,
  StandingRow,
  Player,
  PlayerSeasonStat,
} from "@/lib/domain/types";
import { stageLabel, statLabel, FEATURED_STATS } from "@/lib/i18n";
import { teamLogoUrl } from "@/lib/espn/endpoints";

// ---- küçük yardımcılar ----
function num(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function statNum(v: any): number {
  const n = parseFloat(String(v ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function parseMinute(disp?: string): number {
  if (!disp) return 0;
  const m = String(disp).match(/(\d+)\s*'?(?:\s*\+\s*(\d+))?/);
  if (!m) return 0;
  const base = parseInt(m[1], 10) || 0;
  const extra = m[2] ? parseInt(m[2], 10) : 0;
  return base + extra / 100;
}

function stageFromSeason(slug?: string, name?: string): Stage {
  const s = (slug || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (s.includes("group") || n.includes("group")) return "group";
  if (s.includes("round-of-32") || n.includes("round of 32") || n.includes("32"))
    return "r32";
  if (s.includes("round-of-16") || n.includes("round of 16") || n.includes("16"))
    return "r16";
  if (s.includes("quarter") || n.includes("quarter")) return "qf";
  if (s.includes("semi") || n.includes("semi")) return "sf";
  if (s.includes("third") || n.includes("third")) return "third";
  if (s === "final" || n === "final" || s.includes("final")) return "final";
  return "group";
}

function groupFromNote(note?: string): string | undefined {
  if (!note) return undefined;
  const m = String(note).match(/Group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : undefined;
}

function eventType(d: any): EventType {
  const text = String(d?.type?.text || "").toLowerCase();
  if (d?.redCard || text.includes("red")) return "red";
  if (d?.yellowCard || text.includes("yellow")) return "yellow";
  if (d?.ownGoal || text.includes("own goal")) return "own-goal";
  if (d?.penaltyKick && (d?.scoringPlay || d?.scoreValue > 0)) return "penalty";
  if (d?.scoringPlay || d?.scoreValue > 0 || text.includes("goal")) return "goal";
  if (text.includes("substitution") || d?.substitution) return "sub";
  if (text.includes("var") || text.includes("video")) return "var";
  return "other";
}

const KEEP_EVENTS: EventType[] = [
  "goal",
  "own-goal",
  "penalty",
  "yellow",
  "red",
  "sub",
  "var",
];

function normalizeEvent(d: any): MatchEvent | null {
  const type = eventType(d);
  if (!KEEP_EVENTS.includes(type)) return null;
  const minute = d?.clock?.displayValue || "";
  const athlete = Array.isArray(d?.athletesInvolved)
    ? d.athletesInvolved[0]
    : undefined;
  return {
    minute,
    minuteValue: parseMinute(minute),
    type,
    teamId: String(d?.team?.id ?? ""),
    player: athlete?.displayName,
    playerId: athlete?.id != null ? String(athlete.id) : undefined,
    assist: Array.isArray(d?.athletesInvolved)
      ? d.athletesInvolved[1]?.displayName
      : undefined,
    detailText: d?.type?.text,
  };
}

function buildTeamInMatch(c: any, groupId?: string): TeamInMatch {
  const t = c?.team ?? {};
  const abbr = String(t.abbreviation ?? "");
  return {
    id: String(t.id ?? ""),
    name: String(t.displayName ?? t.name ?? "—"),
    abbr,
    logo: t.logo || (abbr ? teamLogoUrl(abbr) : ""),
    colorHex: t.color ? `#${String(t.color).replace(/^#/, "")}` : undefined,
    groupId,
    homeAway: c?.homeAway === "away" ? "away" : "home",
    score: c?.score != null && c?.score !== "" ? num(c.score) : undefined,
    winner: !!c?.winner,
    form: c?.form,
  };
}

export function normalizeScoreboard(json: any): Match[] {
  const events: any[] = json?.events ?? [];
  const seasonType = json?.leagues?.[0]?.season?.type;
  const out: Match[] = [];

  for (const ev of events) {
    const comp = ev?.competitions?.[0];
    if (!comp) continue;
    const group = groupFromNote(comp?.altGameNote);
    const competitors: any[] = comp?.competitors ?? [];
    const home =
      competitors.find((c) => c?.homeAway === "home") ?? competitors[0];
    const away =
      competitors.find((c) => c?.homeAway === "away") ?? competitors[1];
    if (!home || !away) continue;

    const stage = stageFromSeason(
      ev?.season?.slug ?? seasonType?.abbreviation,
      seasonType?.name,
    );
    const st = comp?.status?.type ?? {};
    const state: "pre" | "in" | "post" =
      st.state === "in" ? "in" : st.state === "post" ? "post" : "pre";

    const venue = comp?.venue ?? {};
    const addr = venue?.address ?? {};

    const rawEvents: MatchEvent[] = (comp?.details ?? [])
      .map(normalizeEvent)
      .filter((e: MatchEvent | null): e is MatchEvent => e !== null)
      .sort((a: MatchEvent, b: MatchEvent) => a.minuteValue - b.minuteValue);

    out.push({
      id: String(ev.id),
      date: ev.date,
      status: state,
      statusDetail: st.shortDetail || st.detail || st.description,
      clock: comp?.status?.displayClock,
      completed: !!st.completed,
      stage,
      roundLabel:
        stage === "group" && group ? `Grup ${group}` : stageLabel(stage),
      group,
      venue: {
        name: venue?.fullName,
        city: addr?.city ?? venue?.city,
        country: addr?.country ?? venue?.country,
      },
      home: buildTeamInMatch(home, group),
      away: buildTeamInMatch(away, group),
      events: rawEvents,
      attendance: comp?.attendance ? num(comp.attendance) : undefined,
      broadcasts: (comp?.broadcasts ?? [])
        .flatMap((b: any) => b?.names ?? [])
        .filter(Boolean),
    });
  }
  return out;
}

// ---- maç özeti (kadro / istatistik / hakem) ----
export interface NormalizedSummary {
  lineups: TeamLineup[];
  teamStats: TeamMatchStat[];
  referee?: string;
  attendance?: number;
}

function normalizeLineupPlayer(p: any): LineupPlayer {
  const a = p?.athlete ?? {};
  return {
    athleteId: String(a.id ?? ""),
    name: String(a.displayName ?? a.fullName ?? "—"),
    jersey: p?.jersey,
    position: p?.position?.abbreviation || p?.position?.name,
    starter: !!p?.starter,
    formationPlace: p?.formationPlace,
    headshot: a?.headshot?.href,
    subbedIn: !!p?.subbedIn,
    subbedOut: !!p?.subbedOut,
    subbedForJersey: p?.subbedOutFor?.jersey,
  };
}

function indexStats(stats: any[]): Record<string, { value: string; label?: string }> {
  const out: Record<string, { value: string; label?: string }> = {};
  for (const s of stats ?? []) {
    if (s?.name) out[s.name] = { value: String(s.displayValue ?? s.value ?? ""), label: s.label };
  }
  return out;
}

export function normalizeSummary(json: any): NormalizedSummary {
  const rosters: any[] = json?.rosters ?? json?.boxscore?.rosters ?? [];
  const lineups: TeamLineup[] = rosters.map((r) => {
    const players: LineupPlayer[] = (r?.roster ?? []).map(normalizeLineupPlayer);
    return {
      teamId: String(r?.team?.id ?? ""),
      starters: players.filter((p) => p.starter),
      subs: players.filter((p) => !p.starter),
    };
  });

  // takım maç istatistikleri
  const boxTeams: any[] = json?.boxscore?.teams ?? [];
  const homeT = boxTeams.find((t) => t?.homeAway === "home") ?? boxTeams[0];
  const awayT = boxTeams.find((t) => t?.homeAway === "away") ?? boxTeams[1];
  const homeStats = indexStats(homeT?.statistics ?? []);
  const awayStats = indexStats(awayT?.statistics ?? []);

  const allNames = Array.from(
    new Set([...Object.keys(homeStats), ...Object.keys(awayStats)]),
  );
  const ordered = [
    ...FEATURED_STATS.filter((n) => allNames.includes(n)),
    ...allNames.filter((n) => !FEATURED_STATS.includes(n)),
  ];

  const teamStats: TeamMatchStat[] = ordered.map((name) => {
    const h = homeStats[name]?.value ?? "—";
    const a = awayStats[name]?.value ?? "—";
    const hn = statNum(h);
    const an = statNum(a);
    let homeRatio: number | undefined;
    let awayRatio: number | undefined;
    if (Number.isFinite(hn) && Number.isFinite(an) && hn + an > 0) {
      homeRatio = hn / (hn + an);
      awayRatio = an / (hn + an);
    }
    return {
      name,
      label:
        statLabel(name) !== name
          ? statLabel(name)
          : homeStats[name]?.label || awayStats[name]?.label || name,
      home: h,
      away: a,
      homeRatio,
      awayRatio,
    };
  });

  const officials: any[] = json?.gameInfo?.officials ?? [];
  const referee =
    officials.find((o) => o?.position?.name === "Referee")?.fullName ||
    officials[0]?.fullName;

  return {
    lineups,
    teamStats,
    referee,
    attendance: json?.gameInfo?.attendance
      ? num(json.gameInfo.attendance)
      : undefined,
  };
}

export function normalizeFormation(json: any): string | undefined {
  return json?.formation?.summary || undefined;
}

// ---- grup tabloları (apis/v2) ----
function statByName(stats: any[], name: string): number {
  const s = (stats ?? []).find((x) => x?.name === name);
  return s ? num(s.value ?? s.displayValue) : 0;
}

function teamFromStandingEntry(t: any): Team {
  const abbr = String(t?.abbreviation ?? "");
  return {
    id: String(t?.id ?? ""),
    name: String(t?.displayName ?? t?.name ?? "—"),
    abbr,
    logo: t?.logos?.[0]?.href || (abbr ? teamLogoUrl(abbr) : ""),
  };
}

export function normalizeStandings(json: any): GroupStanding[] {
  const children: any[] = json?.children ?? [];
  const groups: GroupStanding[] = [];

  for (const g of children) {
    const entries: any[] = g?.standings?.entries ?? [];
    if (!entries.length) continue;
    const rows: StandingRow[] = entries.map((e) => {
      const s = e?.stats ?? [];
      const team = teamFromStandingEntry(e?.team);
      return {
        team,
        played: statByName(s, "gamesPlayed"),
        w: statByName(s, "wins"),
        d: statByName(s, "ties"),
        l: statByName(s, "losses"),
        gf: statByName(s, "pointsFor"),
        ga: statByName(s, "pointsAgainst"),
        gd: statByName(s, "pointDifferential"),
        points: statByName(s, "points"),
        rank: statByName(s, "rank"),
      };
    });
    sortRows(rows);
    const nameLetter =
      String(g?.name ?? "").match(/Group\s+([A-L])/i)?.[1]?.toUpperCase() ??
      letterFromId(g?.id);
    groups.push({
      groupId: nameLetter,
      groupName: `Grup ${nameLetter}`,
      rows,
      provisional: rows.some((r) => r.played < 3),
    });
  }
  groups.sort((a, b) => a.groupId.localeCompare(b.groupId));
  return groups;
}

function letterFromId(id: any): string {
  const n = parseInt(String(id ?? ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= 26
    ? String.fromCharCode(64 + n)
    : String(id ?? "?");
}

function sortRows(rows: StandingRow[]): void {
  rows.sort((a, b) => {
    if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name);
  });
  rows.forEach((r, i) => {
    if (!r.rank) r.rank = i + 1;
  });
}

// cdn.espn yedeği: standings.groups[].standings.entries[]
export function normalizeStandingsFallback(json: any): GroupStanding[] {
  const groupsRaw: any[] =
    json?.standings?.groups ?? json?.content?.standings?.groups ?? [];
  const groups: GroupStanding[] = [];
  for (const g of groupsRaw) {
    const entries: any[] = g?.standings?.entries ?? [];
    if (!entries.length) continue;
    const byAbbr = (s: any[], ab: string) => {
      const x = (s ?? []).find((y) => y?.abbreviation === ab);
      return x ? num(x.value ?? x.displayValue) : 0;
    };
    const rows: StandingRow[] = entries.map((e) => {
      const s = e?.stats ?? [];
      return {
        team: teamFromStandingEntry(e?.team),
        played: byAbbr(s, "GP"),
        w: byAbbr(s, "W"),
        d: byAbbr(s, "D"),
        l: byAbbr(s, "L"),
        gf: byAbbr(s, "F"),
        ga: byAbbr(s, "A"),
        gd: byAbbr(s, "GD"),
        points: byAbbr(s, "P"),
        rank: num(e?.note?.rank),
      };
    });
    sortRows(rows);
    const nameLetter =
      String(g?.name ?? g?.abbreviation ?? "").match(/([A-L])\s*$/i)?.[1]?.toUpperCase() ??
      letterFromId(g?.id);
    groups.push({
      groupId: nameLetter,
      groupName: `Grup ${nameLetter}`,
      rows,
      provisional: rows.some((r) => r.played < 3),
    });
  }
  groups.sort((a, b) => a.groupId.localeCompare(b.groupId));
  return groups;
}

// ---- takımlar ----
export function normalizeTeams(json: any): Team[] {
  const teams: any[] = json?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams.map((w) => {
    const t = w?.team ?? w;
    const abbr = String(t?.abbreviation ?? "");
    return {
      id: String(t?.id ?? ""),
      name: String(t?.displayName ?? t?.name ?? "—"),
      abbr,
      logo: t?.logos?.[0]?.href || (abbr ? teamLogoUrl(abbr) : ""),
      colorHex: t?.color ? `#${String(t.color).replace(/^#/, "")}` : undefined,
    };
  });
}

export function normalizeTeam(json: any): {
  team: Team;
  standingSummary?: string;
  groupId?: string;
} {
  const t = json?.team ?? {};
  const abbr = String(t?.abbreviation ?? "");
  return {
    team: {
      id: String(t?.id ?? ""),
      name: String(t?.displayName ?? t?.name ?? "—"),
      abbr,
      logo: t?.logos?.[0]?.href || (abbr ? teamLogoUrl(abbr) : ""),
      colorHex: t?.color ? `#${String(t.color).replace(/^#/, "")}` : undefined,
    },
    standingSummary: json?.standingSummary,
    groupId: t?.groups?.id ? letterFromId(t.groups.id) : undefined,
  };
}

export function normalizeRoster(json: any, team?: Team): Player[] {
  const athletes: any[] = json?.athletes ?? [];
  return athletes.map((a) => ({
    id: String(a?.id ?? ""),
    name: String(a?.displayName ?? a?.fullName ?? "—"),
    position: a?.position?.name || a?.position?.abbreviation,
    jersey: a?.jersey,
    age: a?.age,
    dob: a?.dateOfBirth,
    height: a?.displayHeight,
    weight: a?.displayWeight,
    nationality: a?.citizenship,
    headshot: a?.headshot?.href,
    teamId: team?.id,
    teamName: team?.name,
    teamAbbr: team?.abbr,
  }));
}

function extractAthleteStats(json: any): PlayerSeasonStat[] {
  const cats =
    json?.athlete?.statistics?.splits?.categories ??
    json?.statistics?.splits?.categories ??
    [];
  const out: PlayerSeasonStat[] = [];
  if (Array.isArray(cats)) {
    for (const c of cats) {
      for (const s of c?.stats ?? []) {
        if (s?.displayName && s?.displayValue != null) {
          out.push({ label: String(s.displayName), value: String(s.displayValue) });
        }
      }
    }
  }
  return out.slice(0, 10);
}

export function normalizeAthlete(json: any): Player {
  const a = json?.athlete ?? {};
  return {
    id: String(a?.id ?? ""),
    name: String(a?.displayName ?? a?.fullName ?? "—"),
    position: a?.position?.name || a?.position?.abbreviation,
    jersey: a?.jersey,
    age: a?.age,
    dob: a?.displayDOB || a?.dateOfBirth,
    height: a?.displayHeight,
    weight: a?.displayWeight,
    nationality: a?.citizenship,
    club: a?.team?.name || a?.team?.displayName,
    teamName: a?.team?.name,
    headshot: a?.headshot?.href,
    seasonStats: extractAthleteStats(json),
  };
}
