// PWA ikonlarını üretir (geometrik SVG → PNG). Çalıştır: node scripts/gen-icons.mjs
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const dir = path.join(process.cwd(), "public", "icons");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#065f46"/></linearGradient></defs>
<rect width="512" height="512" rx="104" fill="url(#g)"/>
<circle cx="256" cy="256" r="150" fill="#ffffff"/>
<polygon points="256,196 297,226 281,274 231,274 215,226" fill="#0b1220"/>
<g stroke="#0b1220" stroke-width="11" stroke-linecap="round">
<line x1="256" y1="196" x2="256" y2="150"/>
<line x1="297" y1="226" x2="338" y2="208"/>
<line x1="281" y1="274" x2="310" y2="314"/>
<line x1="231" y1="274" x2="202" y2="314"/>
<line x1="215" y1="226" x2="174" y2="208"/>
</g></svg>`;

async function main() {
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(svg);
  await sharp(buf).resize(512, 512).png().toFile(path.join(dir, "icon-512.png"));
  await sharp(buf).resize(192, 192).png().toFile(path.join(dir, "icon-192.png"));
  await sharp(buf)
    .resize(180, 180)
    .png()
    .toFile(path.join(dir, "apple-touch-icon.png"));
  console.log("İkonlar üretildi → public/icons/");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
