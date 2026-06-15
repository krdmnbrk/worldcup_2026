// Üst seviye veri katmanı — tek giriş noktası (barrel). Sorumluluklar alt
// modüllere bölündü; tüm sayfalar "@/lib/data" üzerinden bu API'yi kullanır.

export { getAllMatches, getMatchDetail } from "@/lib/data/matches";
export { getStandings } from "@/lib/data/standings";
export { getTeams, getTeamPage, type TeamPage } from "@/lib/data/teams";
export {
  getPlayerIndex,
  getPlayer,
  type PlayerPage,
  type PlayerContribution,
} from "@/lib/data/players";
export { getTournamentStats } from "@/lib/data/stats";
export {
  getBracket,
  computeQualification,
  type Qualification,
  type GroupQualifier,
  type ThirdPlaceRow,
  type BracketData,
} from "@/lib/data/bracket";
export {
  getTurkiye,
  findTurkiyeId,
  type TurkiyePage,
} from "@/lib/data/turkiye";
