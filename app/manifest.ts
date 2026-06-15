import type { MetadataRoute } from "next";

// GitHub Pages alt yolu (/worldcup_2026); start_url/scope/ikonlar buna göre.
const BASE = process.env.NODE_ENV === "production" ? "/worldcup_2026" : "";

// Statik dışa aktarım için gerekli
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "2026 FIFA Dünya Kupası Takip Merkezi",
    short_name: "Dünya Kupası 2026",
    description:
      "Canlı skorlar, fikstür, grup tabloları, eleme ağacı, istatistikler ve oyuncu profilleri.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#070b14",
    theme_color: "#070b14",
    lang: "tr",
    icons: [
      { src: `${BASE}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
