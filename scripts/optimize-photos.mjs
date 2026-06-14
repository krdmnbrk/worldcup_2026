// public/players/ altındaki fotoğrafları küçültüp (256px) webp'e çevirir ve
// data/player-photos.ts manifestini günceller. Site fotoğrafları en fazla ~104px
// gösterdiği için 256px fazlasıyla yeterli (retina dahil).
// Çalıştır: node scripts/optimize-photos.mjs

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "public", "players");
const MANIFEST = path.join(process.cwd(), "data", "player-photos.ts");

async function main() {
  const files = await fs.readdir(DIR);
  let before = 0,
    after = 0,
    ok = 0;
  const ids = [];
  for (const f of files) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    const id = f.split(".")[0];
    const src = path.join(DIR, f);
    try {
      const buf = await fs.readFile(src);
      before += buf.length;
      const out = await sharp(buf)
        .rotate() // EXIF yönünü uygula
        .resize(256, 256, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
      if (!/\.webp$/i.test(f)) await fs.unlink(src);
      await fs.writeFile(path.join(DIR, `${id}.webp`), out);
      after += out.length;
      ok++;
      ids.push(id);
    } catch (e) {
      console.log("! " + f + ": " + e.message);
    }
  }
  const manifest = Object.fromEntries(
    ids.sort().map((id) => [id, `${id}.webp`]),
  );
  const body =
    `// OTOMATIK ÜRETİLDİ — scripts/fetch-player-photos.mjs + optimize-photos.mjs\n` +
    `// Kaynak: Wikipedia / Wikimedia Commons (CC lisanslı). athleteId -> public/players/ dosyası.\n` +
    `export const PLAYER_PHOTOS: Record<string, string> = ${JSON.stringify(manifest, null, 2)};\n`;
  await fs.writeFile(MANIFEST, body);
  console.log(
    `${ok} foto optimize edildi: ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
