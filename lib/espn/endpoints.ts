// ESPN açık API uç (URL) kurucuları. Hepsi anahtarsız, league slug = fifa.world.

const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const SITE_V2 = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world";
const COMMON_V3 =
  "https://site.api.espn.com/apis/common/v3/sports/soccer/fifa.world";
const CORE = "https://sports.core.api.espn.com/v2/sports/soccer";

export const endpoints = {
  // Fikstür + skor + olaylar. dates = "YYYYMMDD-YYYYMMDD"
  scoreboard: (dates: string) => `${SITE}/scoreboard?dates=${dates}`,

  // Maç özeti: kadro, boxscore istatistikleri, hakem/seyirci
  summary: (eventId: string) => `${SITE}/summary?event=${eventId}`,

  // Grup tabloları (12 grup A-L) — DİKKAT: /site/ YOK
  standings: () => `${SITE_V2}/standings?season=2026`,
  standingsFallback: () =>
    "https://cdn.espn.com/core/soccer/table?xhr=1&league=fifa.world",

  // Takımlar / tek takım / kadro
  teams: () => `${SITE}/teams`,
  team: (teamId: string) => `${SITE}/teams/${teamId}`,
  roster: (teamId: string) => `${SITE}/teams/${teamId}/roster`,

  // Oyuncu biyografisi (güncel kulüp + sezon istatistikleri inline)
  athlete: (athleteId: string) => `${COMMON_V3}/athletes/${athleteId}`,

  // Diziliş (formation) — core API; competition id == event id
  formation: (eventId: string, teamId: string) =>
    `${CORE}/leagues/fifa.world/events/${eventId}/competitions/${eventId}/competitors/${teamId}/roster`,
};

// Görsel URL'leri (anahtarsız CDN)
export function playerHeadshotUrl(athleteId: string): string {
  return `https://a.espncdn.com/i/headshots/soccer/players/full/${athleteId}.png`;
}

export function teamLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbr.toLowerCase()}.png`;
}
