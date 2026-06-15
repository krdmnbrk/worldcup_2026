// ESPN ham JSON → temiz domain tipleri. TÜM ESPN tuhaflıkları burada izole edilir.
// Giriş `unknown`; gezinme lib/espn/json.ts güvenli erişimcileriyle (obj/arr/str) yapılır.

import type {
  Match,
  MatchEvent,
  EventType,
  Stage,
  TeamInMatch,
  Team,
  TeamLineup,
  LineupPlayer,
  PlayerMatchStat,
  TeamMatchStat,
  GroupStanding,
  StandingRow,
  Player,
  PlayerSeasonStat,
  MatchPreview,
  TeamForm,
  PreviewGame,
} from "@/lib/domain/types";
import { stageLabel, statLabel, FEATURED_STATS } from "@/lib/i18n";
import { teamLogoUrl } from "@/lib/espn/endpoints";
import { obj, arr, str } from "@/lib/espn/json";

// ---- küçük yardımcılar ----
function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function statNum(v: unknown): number {
  const n = parseFloat(String(v ?? "").replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

// ESPN ölçüleri ABD birimleri (lbs / inch) verir → metrik (kg / cm).
function weightToKg(numeric?: number, display?: string): string | undefined {
  if (numeric && Number.isFinite(numeric))
    return `${Math.round(numeric * 0.453592)} kg`;
  if (!display) return undefined;
  const lbs = String(display).match(/([\d.]+)\s*lbs?/i);
  if (lbs) return `${Math.round(parseFloat(lbs[1]) * 0.453592)} kg`;
  const kg = String(display).match(/([\d.]+)\s*kg/i);
  if (kg) return `${Math.round(parseFloat(kg[1]))} kg`;
  return display;
}
function heightToCm(numeric?: number, display?: string): string | undefined {
  if (numeric && Number.isFinite(numeric))
    return `${Math.round(numeric * 2.54)} cm`;
  if (!display) return undefined;
  const fi = String(display).match(/(\d+)\s*'\s*(\d+)?/); // 6' 3"
  if (fi) {
    const ft = parseInt(fi[1], 10) || 0;
    const inch = fi[2] ? parseInt(fi[2], 10) : 0;
    return `${Math.round((ft * 12 + inch) * 2.54)} cm`;
  }
  const cm = String(display).match(/([\d.]+)\s*cm/i);
  if (cm) return `${Math.round(parseFloat(cm[1]))} cm`;
  return display;
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

function eventType(d: unknown): EventType {
  const o = obj(d);
  const text = (str(obj(o.type).text) ?? "").toLowerCase();
  if (o.redCard || text.includes("red")) return "red";
  if (o.yellowCard || text.includes("yellow")) return "yellow";
  if (o.ownGoal || text.includes("own goal")) return "own-goal";
  if (o.penaltyKick && (o.scoringPlay || num(o.scoreValue) > 0)) return "penalty";
  if (o.scoringPlay || num(o.scoreValue) > 0 || text.includes("goal")) return "goal";
  if (text.includes("substitution") || o.substitution) return "sub";
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

function normalizeEvent(d: unknown): MatchEvent | null {
  const o = obj(d);
  const type = eventType(d);
  if (!KEEP_EVENTS.includes(type)) return null;
  const minute = str(obj(o.clock).displayValue) || "";
  const involved = arr(o.athletesInvolved);
  const a0 = obj(involved[0]);
  return {
    minute,
    minuteValue: parseMinute(minute),
    type,
    teamId: str(obj(o.team).id) ?? "",
    player: str(a0.displayName),
    playerId: a0.id != null ? str(a0.id) : undefined,
    assist: str(obj(involved[1]).displayName),
    detailText: str(obj(o.type).text),
  };
}

function buildTeamInMatch(c: unknown, groupId?: string): TeamInMatch {
  const co = obj(c);
  const t = obj(co.team);
  const abbr = str(t.abbreviation) ?? "";
  const color = str(t.color);
  return {
    id: str(t.id) ?? "",
    name: str(t.displayName) ?? str(t.name) ?? "—",
    abbr,
    logo: str(t.logo) || (abbr ? teamLogoUrl(abbr) : ""),
    colorHex: color ? `#${color.replace(/^#/, "")}` : undefined,
    groupId,
    homeAway: co.homeAway === "away" ? "away" : "home",
    score: co.score != null && co.score !== "" ? num(co.score) : undefined,
    shootoutScore:
      co.shootoutScore != null && co.shootoutScore !== ""
        ? num(co.shootoutScore)
        : undefined,
    winner: !!co.winner,
    form: str(co.form),
  };
}

export function normalizeScoreboard(json: unknown): Match[] {
  const root = obj(json);
  const events = arr(root.events);
  const seasonType = obj(obj(arr(root.leagues)[0]).season).type;
  const st2 = obj(seasonType);
  const out: Match[] = [];

  for (const evRaw of events) {
    const ev = obj(evRaw);
    const competitions = arr(ev.competitions);
    if (!competitions.length) continue;
    const comp = obj(competitions[0]);
    const group = groupFromNote(str(comp.altGameNote));
    const competitors = arr(comp.competitors);
    const home =
      competitors.find((c) => obj(c).homeAway === "home") ?? competitors[0];
    const away =
      competitors.find((c) => obj(c).homeAway === "away") ?? competitors[1];
    if (!home || !away) continue;

    const stage = stageFromSeason(
      str(obj(ev.season).slug) ?? str(st2.abbreviation),
      str(st2.name),
    );
    const status = obj(comp.status);
    const st = obj(status.type);
    const state: "pre" | "in" | "post" =
      st.state === "in" ? "in" : st.state === "post" ? "post" : "pre";

    const venue = obj(comp.venue);
    const addr = obj(venue.address);

    const rawEvents: MatchEvent[] = arr(comp.details)
      .map(normalizeEvent)
      .filter((e): e is MatchEvent => e !== null)
      .sort((a, b) => a.minuteValue - b.minuteValue);

    out.push({
      id: str(ev.id) ?? "",
      date: str(ev.date) ?? "",
      status: state,
      statusDetail:
        str(st.shortDetail) || str(st.detail) || str(st.description),
      clock: str(status.displayClock),
      statusName: str(st.name),
      completed: !!st.completed,
      stage,
      roundLabel:
        stage === "group" && group ? `Grup ${group}` : stageLabel(stage),
      group,
      venue: {
        name: str(venue.fullName),
        city: str(addr.city) ?? str(venue.city),
        country: str(addr.country) ?? str(venue.country),
      },
      home: buildTeamInMatch(home, group),
      away: buildTeamInMatch(away, group),
      events: rawEvents,
      attendance: comp.attendance ? num(comp.attendance) : undefined,
      broadcasts: arr(comp.broadcasts)
        .flatMap((b) => arr(obj(b).names))
        .filter((n): n is string => typeof n === "string" && n.length > 0),
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
  recap?: { headline: string; text: string };
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function playerStatVal(stats: unknown[], name: string): number {
  const s = stats.find((x) => obj(x).name === name);
  return s ? num(obj(s).value ?? obj(s).displayValue) : 0;
}
function normalizePlayerMatchStat(stats: unknown): PlayerMatchStat | undefined {
  if (!Array.isArray(stats) || !stats.length) return undefined;
  return {
    goals: playerStatVal(stats, "totalGoals"),
    assists: playerStatVal(stats, "goalAssists"),
    shots: playerStatVal(stats, "totalShots"),
    shotsOnTarget: playerStatVal(stats, "shotsOnTarget"),
    fouls: playerStatVal(stats, "foulsCommitted"),
    saves: playerStatVal(stats, "saves"),
    yellow: playerStatVal(stats, "yellowCards") > 0,
    red: playerStatVal(stats, "redCards") > 0,
  };
}

function normalizeLineupPlayer(p: unknown): LineupPlayer {
  const po = obj(p);
  const a = obj(po.athlete);
  const position = obj(po.position);
  return {
    athleteId: str(a.id) ?? "",
    name: str(a.displayName) ?? str(a.fullName) ?? "—",
    jersey: str(po.jersey),
    position: str(position.abbreviation) || str(position.name),
    starter: !!po.starter,
    formationPlace: str(po.formationPlace),
    headshot: str(obj(a.headshot).href),
    subbedIn: !!po.subbedIn,
    subbedOut: !!po.subbedOut,
    subbedForJersey: str(obj(po.subbedOutFor).jersey),
    captain: !!po.captain,
    stats: normalizePlayerMatchStat(po.stats),
  };
}

function indexStats(
  stats: unknown[],
): Record<string, { value: string; label?: string }> {
  const out: Record<string, { value: string; label?: string }> = {};
  for (const sRaw of stats) {
    const s = obj(sRaw);
    const name = str(s.name);
    if (name)
      out[name] = {
        value: str(s.displayValue) ?? str(s.value) ?? "",
        label: str(s.label),
      };
  }
  return out;
}

export function normalizeSummary(json: unknown): NormalizedSummary {
  const root = obj(json);
  const rosters =
    root.rosters != null ? arr(root.rosters) : arr(obj(root.boxscore).rosters);
  const lineups: TeamLineup[] = rosters.map((rRaw) => {
    const r = obj(rRaw);
    const players: LineupPlayer[] = arr(r.roster).map(normalizeLineupPlayer);
    return {
      teamId: str(obj(r.team).id) ?? "",
      starters: players.filter((p) => p.starter),
      subs: players.filter((p) => !p.starter),
    };
  });

  // takım maç istatistikleri
  const boxTeams = arr(obj(root.boxscore).teams);
  const homeT = boxTeams.find((t) => obj(t).homeAway === "home") ?? boxTeams[0];
  const awayT = boxTeams.find((t) => obj(t).homeAway === "away") ?? boxTeams[1];
  const homeStats = indexStats(arr(obj(homeT).statistics));
  const awayStats = indexStats(arr(obj(awayT).statistics));

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

  const gameInfo = obj(root.gameInfo);
  const officials = arr(gameInfo.officials);
  const refMatch = officials.find(
    (o) => obj(obj(o).position).name === "Referee",
  );
  const referee =
    str(obj(refMatch).fullName) || str(obj(officials[0]).fullName);

  const article = obj(root.article);
  const headline = str(article.headline);
  const story = str(article.story);
  const recap =
    headline && story ? { headline, text: stripHtml(story) } : undefined;

  return {
    lineups,
    teamStats,
    referee,
    attendance: gameInfo.attendance ? num(gameInfo.attendance) : undefined,
    recap,
  };
}

export function normalizeFormation(json: unknown): string | undefined {
  return str(obj(obj(json).formation).summary) || undefined;
}

// ---- maç önizleme (pre-maç): form + H2H + bahis oranı ----
function mapPreviewGame(e: unknown): PreviewGame {
  const o = obj(e);
  const r = (str(o.gameResult) ?? "").toUpperCase();
  const opp = o.opponent;
  return {
    date: str(o.gameDate),
    result: r === "W" || r === "D" || r === "L" ? (r as "W" | "D" | "L") : undefined,
    score: o.score ? str(o.score) : undefined,
    opponent:
      typeof opp === "string"
        ? opp
        : str(obj(opp).displayName) || str(obj(opp).abbreviation),
    opponentLogo:
      str(o.opponentLogo) || str(obj(arr(obj(opp).logos)[0]).href),
    competition:
      str(o.leagueAbbreviation) || str(o.leagueName) || str(o.competitionName),
  };
}

export function normalizePreview(json: unknown): MatchPreview {
  const root = obj(json);
  const o = obj(arr(root.odds)[0] ?? arr(root.pickcenter)[0]);
  const hasOdds = arr(root.odds).length > 0 || arr(root.pickcenter).length > 0;
  const odds = hasOdds
    ? {
        provider: str(obj(o.provider).name),
        detail: str(o.details),
        overUnder: o.overUnder != null ? str(o.overUnder) : undefined,
      }
    : undefined;

  const teamForm: TeamForm[] = arr(root.lastFiveGames).map((tRaw) => {
    const t = obj(tRaw);
    return {
      teamId: str(obj(t.team).id) ?? "",
      games: arr(t.events).map(mapPreviewGame),
    };
  });

  const h2h: PreviewGame[] = arr(obj(arr(root.headToHeadGames)[0]).events).map(
    mapPreviewGame,
  );

  return { odds, teamForm, h2h };
}

// ---- grup tabloları (apis/v2) ----
function statByName(stats: unknown[], name: string): number {
  const s = stats.find((x) => obj(x).name === name);
  return s ? num(obj(s).value ?? obj(s).displayValue) : 0;
}

function teamFromStandingEntry(t: unknown): Team {
  const td = obj(t);
  const abbr = str(td.abbreviation) ?? "";
  return {
    id: str(td.id) ?? "",
    name: str(td.displayName) ?? str(td.name) ?? "—",
    abbr,
    logo: str(obj(arr(td.logos)[0]).href) || (abbr ? teamLogoUrl(abbr) : ""),
  };
}

export function normalizeStandings(json: unknown): GroupStanding[] {
  const children = arr(obj(json).children);
  const groups: GroupStanding[] = [];

  for (const gRaw of children) {
    const g = obj(gRaw);
    const entries = arr(obj(g.standings).entries);
    if (!entries.length) continue;
    const rows: StandingRow[] = entries.map((eRaw) => {
      const e = obj(eRaw);
      const s = arr(e.stats);
      const team = teamFromStandingEntry(e.team);
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
      (str(g.name) ?? "").match(/Group\s+([A-L])/i)?.[1]?.toUpperCase() ??
      letterFromId(g.id);
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

function letterFromId(id: unknown): string {
  const raw = str(id) ?? "";
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= 26
    ? String.fromCharCode(64 + n)
    : raw || "?";
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
export function normalizeStandingsFallback(json: unknown): GroupStanding[] {
  const root = obj(json);
  const groupsRaw = arr(
    obj(root.standings).groups ?? obj(obj(root.content).standings).groups,
  );
  const groups: GroupStanding[] = [];
  for (const gRaw of groupsRaw) {
    const g = obj(gRaw);
    const entries = arr(obj(g.standings).entries);
    if (!entries.length) continue;
    const byAbbr = (s: unknown[], ab: string) => {
      const x = s.find((y) => obj(y).abbreviation === ab);
      return x ? num(obj(x).value ?? obj(x).displayValue) : 0;
    };
    const rows: StandingRow[] = entries.map((eRaw) => {
      const e = obj(eRaw);
      const s = arr(e.stats);
      return {
        team: teamFromStandingEntry(e.team),
        played: byAbbr(s, "GP"),
        w: byAbbr(s, "W"),
        d: byAbbr(s, "D"),
        l: byAbbr(s, "L"),
        gf: byAbbr(s, "F"),
        ga: byAbbr(s, "A"),
        gd: byAbbr(s, "GD"),
        points: byAbbr(s, "P"),
        rank: num(obj(e.note).rank),
      };
    });
    sortRows(rows);
    const nameLetter =
      (str(g.name) ?? str(g.abbreviation) ?? "")
        .match(/([A-L])\s*$/i)?.[1]
        ?.toUpperCase() ?? letterFromId(g.id);
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
export function normalizeTeams(json: unknown): Team[] {
  const sports = arr(obj(json).sports);
  const leagues = arr(obj(sports[0]).leagues);
  const teams = arr(obj(leagues[0]).teams);
  return teams.map((w) => {
    const t = obj(obj(w).team ?? w);
    const abbr = str(t.abbreviation) ?? "";
    const color = str(t.color);
    return {
      id: str(t.id) ?? "",
      name: str(t.displayName) ?? str(t.name) ?? "—",
      abbr,
      logo: str(obj(arr(t.logos)[0]).href) || (abbr ? teamLogoUrl(abbr) : ""),
      colorHex: color ? `#${color.replace(/^#/, "")}` : undefined,
    };
  });
}

export function normalizeTeam(json: unknown): {
  team: Team;
  standingSummary?: string;
  groupId?: string;
} {
  const root = obj(json);
  const t = obj(root.team);
  const abbr = str(t.abbreviation) ?? "";
  const color = str(t.color);
  const groups = obj(t.groups);
  return {
    team: {
      id: str(t.id) ?? "",
      name: str(t.displayName) ?? str(t.name) ?? "—",
      abbr,
      logo: str(obj(arr(t.logos)[0]).href) || (abbr ? teamLogoUrl(abbr) : ""),
      colorHex: color ? `#${color.replace(/^#/, "")}` : undefined,
    },
    standingSummary: str(root.standingSummary),
    groupId: groups.id ? letterFromId(groups.id) : undefined,
  };
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

export function normalizeRoster(json: unknown, team?: Team): Player[] {
  const athletes = arr(obj(json).athletes);
  return athletes.map((aRaw) => {
    const a = obj(aRaw);
    const position = obj(a.position);
    return {
      id: str(a.id) ?? "",
      name: str(a.displayName) ?? str(a.fullName) ?? "—",
      position: str(position.name) || str(position.abbreviation),
      jersey: str(a.jersey),
      age: numOrUndef(a.age),
      dob: str(a.dateOfBirth),
      height: heightToCm(numOrUndef(a.height), str(a.displayHeight)),
      weight: weightToKg(numOrUndef(a.weight), str(a.displayWeight)),
      nationality: str(a.citizenship),
      headshot: str(obj(a.headshot).href),
      teamId: team?.id,
      teamName: team?.name,
      teamAbbr: team?.abbr,
    };
  });
}

function extractAthleteStats(json: unknown): PlayerSeasonStat[] {
  const root = obj(json);
  const cats = arr(
    obj(obj(obj(root.athlete).statistics).splits).categories ??
      obj(obj(root.statistics).splits).categories,
  );
  const out: PlayerSeasonStat[] = [];
  for (const cRaw of cats) {
    for (const sRaw of arr(obj(cRaw).stats)) {
      const s = obj(sRaw);
      const label = str(s.displayName);
      if (label && s.displayValue != null) {
        out.push({ label, value: str(s.displayValue) ?? "" });
      }
    }
  }
  return out.slice(0, 10);
}

export function normalizeAthlete(json: unknown): Player {
  const a = obj(obj(json).athlete);
  const position = obj(a.position);
  const team = obj(a.team);
  return {
    id: str(a.id) ?? "",
    name: str(a.displayName) ?? str(a.fullName) ?? "—",
    position: str(position.name) || str(position.abbreviation),
    jersey: str(a.jersey),
    age: numOrUndef(a.age),
    dob: str(a.displayDOB) || str(a.dateOfBirth),
    height: heightToCm(numOrUndef(a.height), str(a.displayHeight)),
    weight: weightToKg(numOrUndef(a.weight), str(a.displayWeight)),
    nationality: str(a.citizenship),
    club: str(team.name) || str(team.displayName),
    teamName: str(team.name),
    headshot: str(obj(a.headshot).href),
    seasonStats: extractAthleteStats(json),
  };
}
