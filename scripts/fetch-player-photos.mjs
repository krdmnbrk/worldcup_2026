// Türk (ve istenirse diğer) milli takım oyuncuları için Wikipedia/Wikimedia Commons'tan
// (ücretsiz, CC lisanslı) fotoğraf indirir → public/players/ + data/player-photos.ts manifesti.
// Çalıştır: node scripts/fetch-player-photos.mjs [takimId ...]   (varsayılan: 465 = Türkiye)

import { promises as fs } from "fs";
import path from "path";

const UA =
  "WC2026Tracker/1.0 (kisisel hobi projesi; bk.karaduman@gmail.com) node-fetch";
const OUT_DIR = path.join(process.cwd(), "public", "players");
const MANIFEST = path.join(process.cwd(), "data", "player-photos.ts");

const teamIds = process.argv.slice(2).length ? process.argv.slice(2) : ["465"];

async function getJson(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function roster(teamId) {
  const j = await getJson(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${teamId}/roster`,
  );
  return (j.athletes || []).map((a) => ({
    id: String(a.id),
    name: a.displayName || a.fullName,
    full: a.fullName || a.displayName,
  }));
}

async function wikiImage(title, lang) {
  if (!title) return null;
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail|original&pithumbsize=500&redirects=1&titles=${encodeURIComponent(title)}`;
    const j = await getJson(url);
    const pages = j.query?.pages || {};
    for (const k of Object.keys(pages)) {
      if (k === "-1") continue;
      const p = pages[k];
      const src = p.thumbnail?.source || p.original?.source;
      // logo/flag gibi küçük olmayan, gerçek foto olsun diye thumbnail'ı tercih
      if (src) return src;
    }
  } catch {
    /* yoksay */
  }
  return null;
}

async function wikiSearchImage(name, lang) {
  try {
    const s = await getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(name + " footballer")}`,
    );
    const hit = s.query?.search?.[0]?.title;
    return hit ? wikiImage(hit, lang) : null;
  } catch {
    return null;
  }
}

async function findImage(p) {
  return (
    (await wikiImage(p.name, "tr")) ||
    (await wikiImage(p.full, "tr")) ||
    (await wikiImage(p.name, "en")) ||
    (await wikiSearchImage(p.name, "en")) ||
    (await wikiSearchImage(p.name, "tr"))
  );
}

async function download(url, id) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`img HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  let ext = (url.split("?")[0].match(/\.(jpe?g|png|webp)$/i)?.[1] || "jpg").toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  const file = `${id}.${ext}`;
  await fs.writeFile(path.join(OUT_DIR, file), buf);
  return file;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  let total = 0,
    ok = 0;
  const misses = [];
  for (const tid of teamIds) {
    const players = await roster(tid);
    console.log(`\nTakım ${tid}: ${players.length} oyuncu`);
    for (const p of players) {
      total++;
      try {
        const img = await findImage(p);
        if (!img) {
          misses.push(p.name);
          console.log("  ✗ foto yok:", p.name);
        } else {
          const file = await download(img, p.id);
          manifest[p.id] = file;
          ok++;
          console.log("  ✓", p.name, "→", file);
        }
      } catch (e) {
        misses.push(p.name);
        console.log("  ! hata", p.name, e.message);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  const body =
    `// OTOMATIK ÜRETİLDİ — scripts/fetch-player-photos.mjs\n` +
    `// Kaynak: Wikipedia / Wikimedia Commons (CC lisanslı). athleteId -> public/players/ dosyası.\n` +
    `export const PLAYER_PHOTOS: Record<string, string> = ${JSON.stringify(manifest, null, 2)};\n`;
  await fs.writeFile(MANIFEST, body);
  console.log(`\n${ok}/${total} fotoğraf indirildi → public/players/`);
  if (misses.length) console.log("Eksikler:", misses.join(", "));
}

main().catch((e) => {
  console.error("Beklenmeyen hata:", e);
  process.exit(1);
});
