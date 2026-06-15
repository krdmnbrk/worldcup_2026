// Tarayıcıdan doğrudan ESPN'e (CORS açık) erişen istemci tarafı veri çekiciler.
// Statik GitHub Pages sürümünde canlı güncellemeyi bunlar sağlar.
// Sunucuya özel hiçbir şey (fs/snapshot/next önbellek) import ETMEZ — yalnızca saf normalize'lar.

import { endpoints, TOURNAMENT_CHUNKS } from "@/lib/espn/endpoints";
import {
  normalizeScoreboard,
  normalizeStandings,
  normalizeSummary,
  normalizeFormation,
  normalizeAthlete,
  normalizePreview,
  type NormalizedSummary,
} from "@/lib/espn/normalize";
import type {
  Match,
  GroupStanding,
  Player,
  MatchPreview,
} from "@/lib/domain/types";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}

function ymd(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// null döndürür (boş değil) → tüm dilimler başarısızsa son iyi veri korunur,
// geçici ESPN hatası fikstürü boşaltmaz.
export async function browserAllMatches(): Promise<Match[] | null> {
  const res = await Promise.all(
    TOURNAMENT_CHUNKS.map((c) =>
      getJson(endpoints.scoreboard(c))
        .then(normalizeScoreboard)
        .catch(() => [] as Match[]),
    ),
  );
  const map = new Map<string, Match>();
  for (const m of res.flat()) map.set(m.id, m);
  if (map.size === 0) return null; // hepsi başarısız → güncelleme yok
  return Array.from(map.values()).sort(
    (a, b) => +new Date(a.date) - +new Date(b.date),
  );
}

// Yalnızca bugünün penceresi (tek istek) — global canlı çubuk için hafif.
// Boş dizi geçerli sonuçtur (bugün maç yok); hata → null (son iyi veriyi koru).
export async function browserLiveToday(): Promise<Match[] | null> {
  try {
    const now = Date.now();
    const from = ymd(new Date(now - 86400000).toISOString());
    const to = ymd(new Date(now + 86400000).toISOString());
    return normalizeScoreboard(
      await getJson(endpoints.scoreboard(`${from}-${to}`)),
    );
  } catch {
    return null;
  }
}

// Hata/boş → null (son iyi veriyi koru); geçici ESPN hatası grup tablolarını boşaltmaz.
export async function browserStandings(): Promise<GroupStanding[] | null> {
  try {
    const g = normalizeStandings(await getJson(endpoints.standings()));
    if (g.length) return g;
  } catch {
    /* yoksay */
  }
  return null;
}

export async function browserMatch(
  id: string,
  dateIso: string,
): Promise<Match | null> {
  try {
    const day = ymd(dateIso);
    const ms = normalizeScoreboard(
      await getJson(endpoints.scoreboard(`${day}-${day}`)),
    );
    return ms.find((m) => m.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function browserSummary(
  id: string,
): Promise<NormalizedSummary | null> {
  try {
    return normalizeSummary(await getJson(endpoints.summary(id)));
  } catch {
    return null;
  }
}

export async function browserFormation(
  eventId: string,
  teamId: string,
): Promise<string | undefined> {
  try {
    return normalizeFormation(await getJson(endpoints.formation(eventId, teamId)));
  } catch {
    return undefined;
  }
}

export async function browserPreview(id: string): Promise<MatchPreview | null> {
  try {
    return normalizePreview(await getJson(endpoints.summary(id)));
  } catch {
    return null;
  }
}

export async function browserAthlete(id: string): Promise<Player | null> {
  try {
    return normalizeAthlete(await getJson(endpoints.athlete(id)));
  } catch {
    return null;
  }
}
