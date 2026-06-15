import type { MetadataRoute } from "next";

// Statik dışa aktarım için gerekli
export const dynamic = "force-static";

const SITE_URL = "https://krdmnbrk.github.io/worldcup_2026";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
