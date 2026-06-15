// Turnuva geneli istatistikler — tüm maçların olaylarından/skorlarından hesaplanır
// (gol/asist krallığı, takım golleri, fair-play, gol dakika dağılımı, clean sheet).

import { espnFetch } from "@/lib/espn/client";
import { endpoints } from "@/lib/espn/endpoints";
import { normalizeSummary } from "@/lib/espn/normalize";
import { withSnapshot } from "@/lib/snapshot";
import type {
  Match,
  Player,
  StatLeader,
  TeamGoalCount,
  FairPlayRow,
  TournamentStats,
  DataResult,
} from "@/lib/domain/types";
import { fetchAllMatches, fetchPlayerIndex } from "@/lib/data/fetchers";

type TeamMini = { name: string; abbr: string; logo: string };

function teamLookup(matches: Match[]): Map<string, TeamMini> {
  const map = new Map<string, TeamMini>();
  for (const m of matches) {
    for (const t of [m.home, m.away])
      if (t.id) map.set(t.id, { name: t.name, abbr: t.abbr, logo: t.logo });
  }
  return map;
}

// Gol dakikasının ait olduğu 15'lik dilim (0..5).
function bucketOf(min: number): number {
  return min <= 15
    ? 0
    : min <= 30
      ? 1
      : min <= 45
        ? 2
        : min <= 60
          ? 3
          : min <= 75
            ? 4
            : 5;
}

// Bir lider haritasında kaydı oluştur/var olanı artır (gol/kart/asist için ortak).
function bumpLeader(
  map: Map<string, StatLeader>,
  key: string,
  init: () => StatLeader,
  by = 1,
): void {
  const cur = map.get(key) ?? init();
  cur.value += by;
  map.set(key, cur);
}

// Eşzamanlılık sınırlı paralel işlem (ESPN'i yormamak için)
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    },
  );
  await Promise.all(workers);
  return out;
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
      const teamCards = new Map<string, { yellow: number; red: number }>();
      const goalBuckets = [0, 0, 0, 0, 0, 0];
      let yellowCards = 0,
        redCards = 0;

      for (const m of matches) {
        for (const e of m.events) {
          const t = e.teamId ? teams.get(e.teamId) : undefined;
          if (
            e.type === "goal" ||
            e.type === "penalty" ||
            e.type === "own-goal"
          ) {
            goalBuckets[bucketOf(Math.floor(e.minuteValue || 0))]++;
          }
          if ((e.type === "yellow" || e.type === "red") && e.teamId) {
            const tc = teamCards.get(e.teamId) || { yellow: 0, red: 0 };
            if (e.type === "yellow") tc.yellow++;
            else tc.red++;
            teamCards.set(e.teamId, tc);
          }
          if ((e.type === "goal" || e.type === "penalty") && e.player) {
            const key = e.playerId || `${e.player}-${e.teamId}`;
            bumpLeader(scorerMap, key, () => ({
              id: e.playerId || key,
              name: e.player!,
              teamId: e.teamId,
              teamAbbr: t?.abbr,
              teamName: t?.name,
              headshot: e.playerId
                ? indexMap.get(e.playerId)?.headshot
                : undefined,
              value: 0,
            }));
          }
          if (e.type === "yellow") yellowCards++;
          if (e.type === "red") redCards++;
          if ((e.type === "yellow" || e.type === "red") && e.player) {
            const key = e.playerId || `${e.player}-${e.teamId}`;
            bumpLeader(carded, key, () => ({
              id: e.playerId || key,
              name: e.player!,
              teamId: e.teamId,
              teamAbbr: t?.abbr,
              teamName: t?.name,
              headshot: e.playerId
                ? indexMap.get(e.playerId)?.headshot
                : undefined,
              value: 0,
            }));
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
          if (!biggest || margin > biggest.margin)
            biggest = { match: m, margin };
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

      // asist krallığı — oynanan maç summary'lerinden goalAssists topla
      const assistMap = new Map<string, StatLeader>();
      const summaries = await mapPool(played, 6, (m) =>
        espnFetch<unknown>(endpoints.summary(m.id), {
          revalidate: 3600,
          tags: ["summary"],
        })
          .then(normalizeSummary)
          .catch(() => null),
      );
      for (const s of summaries) {
        if (!s) continue;
        for (const lu of s.lineups) {
          const t = teams.get(lu.teamId);
          for (const p of [...lu.starters, ...lu.subs]) {
            const a = p.stats?.assists ?? 0;
            if (a > 0 && p.athleteId) {
              bumpLeader(
                assistMap,
                p.athleteId,
                () => ({
                  id: p.athleteId!,
                  name: p.name,
                  teamId: lu.teamId,
                  teamAbbr: t?.abbr,
                  teamName: t?.name,
                  headshot: indexMap.get(p.athleteId!)?.headshot ?? p.headshot,
                  value: 0,
                }),
                a,
              );
            }
          }
        }
      }
      const assistLeaders = Array.from(assistMap.values())
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .slice(0, 12);

      const fairPlay: FairPlayRow[] = Array.from(teamCards.entries())
        .map(([id, c]) => {
          const t = teams.get(id);
          return {
            teamId: id,
            teamName: t?.name || "—",
            teamAbbr: t?.abbr || "",
            logo: t?.logo || "",
            yellow: c.yellow,
            red: c.red,
            points: c.yellow * 1 + c.red * 3,
          };
        })
        .sort((a, b) => b.points - a.points || b.red - a.red)
        .slice(0, 16);

      const goalIntervals = [
        "1-15",
        "16-30",
        "31-45",
        "46-60",
        "61-75",
        "76-90+",
      ].map((label, i) => ({ label, value: goalBuckets[i] }));

      return {
        topScorers,
        assistLeaders,
        teamGoals,
        topCarded,
        fairPlay,
        goalIntervals,
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
