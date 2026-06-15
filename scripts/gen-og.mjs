// Sosyal paylaşım görseli (Open Graph, 1200×630) üretir. Çalıştır: npm run gen:og
import sharp from "sharp";
import path from "path";

const out = path.join(process.cwd(), "public", "og.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b2a1c"/><stop offset="1" stop-color="#070b14"/>
    </linearGradient>
    <linearGradient id="ball" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#065f46"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="none"/>
  <g transform="translate(940,150)">
    <circle cx="120" cy="120" r="120" fill="url(#ball)"/>
    <circle cx="120" cy="120" r="78" fill="#ffffff"/>
    <polygon points="120,88 142,104 134,130 106,130 98,104" fill="#0b1220"/>
  </g>
  <text x="80" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="700" fill="#34d399" letter-spacing="2">FIFA DÜNYA KUPASI</text>
  <text x="80" y="350" font-family="Segoe UI, Arial, sans-serif" font-size="120" font-weight="800" fill="#ffffff">2026</text>
  <text x="80" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="500" fill="#cbd5e1">Takip Merkezi · Canlı skor, fikstür, istatistik</text>
  <text x="80" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="400" fill="#64748b">Kuzey Amerika · 11 Haziran – 19 Temmuz 2026</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("OG görseli üretildi → public/og.png");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
