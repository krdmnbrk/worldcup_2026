import type { MetadataRoute } from "next";
import { getAllMatches, getTeams, getPlayerIndex } from "@/lib/data";

// Statik dışa aktarım için gerekli; build aninda tek sefer üretilir.
export const dynamic = "force-static";

const SITE_URL = "https://krdmnbrk.github.io/worldcup_2026";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/fikstur",
    "/gruplar",
    "/eleme",
    "/istatistikler",
    "/takimlar",
    "/turkiye",
  ];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}/`,
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.7,
  }));

  // Dinamik sayfalar (maç/takım/oyuncu) — veri çekilemezse statik yollarla yetin.
  try {
    const [{ data: matches }, { data: teams }, { data: players }] =
      await Promise.all([getAllMatches(), getTeams(), getPlayerIndex()]);
    for (const m of matches)
      entries.push({
        url: `${SITE_URL}/maclar/${m.id}/`,
        changeFrequency: "hourly",
        priority: 0.6,
      });
    for (const t of teams)
      entries.push({
        url: `${SITE_URL}/takimlar/${t.id}/`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    for (const p of players)
      if (p.id)
        entries.push({
          url: `${SITE_URL}/oyuncular/${p.id}/`,
          changeFrequency: "weekly",
          priority: 0.4,
        });
  } catch {
    /* veri yoksa yalnızca statik yollar */
  }
  return entries;
}
