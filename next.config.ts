import type { NextConfig } from "next";

// GitHub Pages: statik dışa aktarım + proje deposu alt yolu (/worldcup_2026).
// Yerel geliştirmede (npm run dev) basePath boş kalır.
const repo = "worldcup_2026";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
