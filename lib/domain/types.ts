// Tüm uygulamanın gördüğü normalize edilmiş alan (domain) tipleri.
// ESPN'in ham/tuhaf alan adları lib/espn/normalize.ts dışına sızmaz.

export type MatchStatus = "pre" | "in" | "post";

export type Stage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final"
  | "unknown";

export interface Team {
  id: string;
  name: string; // ESPN displayName (TR çevirisi i18n ile)
  abbr: string; // 3 harf, ör. TUR
  logo: string; // ESPN ülke logosu URL'si
  colorHex?: string;
  groupId?: string; // "A".."L"
}

export interface TeamInMatch extends Team {
  score?: number;
  shootoutScore?: number; // penaltı atışları skoru (eleme)
  homeAway: "home" | "away";
  winner?: boolean;
  form?: string;
}

export type EventType =
  | "goal"
  | "own-goal"
  | "penalty"
  | "yellow"
  | "red"
  | "sub"
  | "var"
  | "other";

export interface MatchEvent {
  minute: string; // "9'", "90'+2'"
  minuteValue: number; // sıralama için sayısal
  type: EventType;
  teamId: string;
  player?: string;
  playerId?: string;
  assist?: string;
  detailText?: string;
}

export interface Match {
  id: string;
  date: string; // ISO UTC
  status: MatchStatus;
  statusDetail?: string; // "FT", "HT" vb.
  clock?: string;
  completed: boolean;
  stage: Stage;
  roundLabel: string; // TR etiket
  group?: string; // "A".."L"
  venue: { name?: string; city?: string; country?: string };
  home: TeamInMatch;
  away: TeamInMatch;
  events: MatchEvent[];
  attendance?: number;
  broadcasts?: string[];
}

export interface PlayerMatchStat {
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  saves: number;
  yellow: boolean;
  red: boolean;
}

export interface LineupPlayer {
  athleteId: string;
  name: string;
  jersey?: string;
  position?: string;
  starter: boolean;
  formationPlace?: string;
  headshot?: string;
  subbedIn?: boolean;
  subbedOut?: boolean;
  subbedForJersey?: string;
  captain?: boolean;
  stats?: PlayerMatchStat;
}

// Maç önizleme (pre-maç): form + H2H + bahis oranı
export interface PreviewGame {
  date?: string;
  result?: "W" | "D" | "L";
  score?: string;
  opponent?: string;
  opponentLogo?: string;
  competition?: string;
}
export interface TeamForm {
  teamId: string;
  games: PreviewGame[];
}
export interface MatchOdds {
  provider?: string;
  detail?: string; // ör. "MEX -1.5"
  overUnder?: string;
}
export interface MatchPreview {
  odds?: MatchOdds;
  teamForm: TeamForm[];
  h2h: PreviewGame[]; // ev sahibi perspektifinden geçmiş karşılaşmalar
}

export interface TeamLineup {
  teamId: string;
  formation?: string;
  coach?: string;
  starters: LineupPlayer[];
  subs: LineupPlayer[];
}

export interface TeamMatchStat {
  name: string;
  label: string; // TR
  home: string;
  away: string;
  // 0-1 arası oran (bar genişliği için), yoksa undefined
  homeRatio?: number;
  awayRatio?: number;
}

export interface MatchDetail {
  match: Match;
  lineups: TeamLineup[]; // [ev, deplasman]
  teamStats: TeamMatchStat[];
  referee?: string;
  attendance?: number;
}

export interface StandingRow {
  team: Team;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank: number;
}

export interface GroupStanding {
  groupId: string; // "A".."L"
  groupName: string; // "Grup A"
  rows: StandingRow[];
  provisional: boolean;
}

export interface PlayerSeasonStat {
  label: string;
  value: string;
}

export interface Player {
  id: string;
  name: string;
  position?: string;
  jersey?: string;
  age?: number;
  dob?: string;
  height?: string;
  weight?: string;
  nationality?: string;
  club?: string;
  headshot?: string;
  teamId?: string;
  teamName?: string;
  teamAbbr?: string;
  seasonStats?: PlayerSeasonStat[];
}

export interface StatLeader {
  id: string;
  name: string;
  teamId?: string;
  teamAbbr?: string;
  teamName?: string;
  logo?: string;
  value: number;
  headshot?: string;
}

export interface TeamGoalCount {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  logo: string;
  value: number;
}

export interface FairPlayRow {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  logo: string;
  yellow: number;
  red: number;
  points: number; // ceza puanı (düşük = daha temiz): sarı×1 + kırmızı×3
}

export interface TournamentStats {
  topScorers: StatLeader[];
  assistLeaders: StatLeader[];
  teamGoals: TeamGoalCount[];
  topCarded: StatLeader[];
  fairPlay: FairPlayRow[];
  goalIntervals: { label: string; value: number }[];
  yellowCards: number;
  redCards: number;
  totalGoals: number;
  totalMatches: number;
  playedMatches: number;
  avgGoalsPerMatch: number;
  biggestWin?: { match: Match; margin: number };
  cleanSheetTeams: TeamGoalCount[];
}

export type BracketRound = "R32" | "R16" | "QF" | "SF" | "3RD" | "F";

export interface BracketTeam {
  team?: Team;
  placeholder?: string;
  score?: number;
  shootout?: number;
}

export interface BracketSlot {
  id: string;
  round: BracketRound;
  matchId?: string;
  home: BracketTeam;
  away: BracketTeam;
  date?: string;
  status?: MatchStatus;
}

export interface Bracket {
  slots: BracketSlot[];
  provisional: boolean;
  qualifiersKnown: boolean;
}

// Snapshot/yedek sarmalayıcısı: veri canlı mı yoksa son bilinen mi?
export interface DataResult<T> {
  data: T;
  stale: boolean;
}
