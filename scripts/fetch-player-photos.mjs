// Milli takım oyuncuları için Wikipedia/Wikimedia Commons'tan (ücretsiz, CC lisanslı)
// fotoğraf indirir → public/players/ + data/player-photos.ts manifesti.
//
// Kullanım:
//   node scripts/fetch-player-photos.mjs all        # turnuvadaki 48 takımın hepsi
//   node scripts/fetch-player-photos.mjs 465 660    # belirli takım id'leri (465=Türkiye)
//   node scripts/fetch-player-photos.mjs            # varsayılan: 465 (Türkiye)
//
// Önbellekli: public/players/ altında zaten dosyası olan oyuncu tekrar indirilmez.

import { promises as fs } from "fs";
import path from "path";

const UA =
  "WC2026Tracker/1.0 (kisisel hobi projesi; bk.karaduman@gmail.com) node-fetch";
const OUT_DIR = path.join(process.cwd(), "public", "players");
const MANIFEST = path.join(process.cwd(), "data", "player-photos.ts");
const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const STANDINGS =
  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026";
const CONCURRENCY = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  let r;
  try {
    r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  if (r.status === 429 && attempt < 5) {
    await sleep(1800 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function allTeams() {
  const j = await getJson(STANDINGS);
  const map = new Map();
  for (const g of j.children || [])
    for (const e of g.standings?.entries || [])
      if (e.team?.id) map.set(String(e.team.id), e.team.displayName || e.team.name);
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

async function roster(teamId) {
  const j = await getJson(`${SITE}/teams/${teamId}/roster`);
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
      const src = pages[k].thumbnail?.source || pages[k].original?.source;
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
  // ESPN adlarda aksanları siler (ör. "Lukás" → "Lukáš"), bu yüzden arama (search)
  // erken denenir; çoğu milli oyuncunun İngilizce Wikipedia sayfası fotolu.
  return (
    (await wikiImage(p.name, "en")) ||
    (await wikiSearchImage(p.name, "en")) ||
    (await wikiImage(p.name, "tr")) ||
    (await wikiImage(p.full, "en")) ||
    (await wikiSearchImage(p.name, "tr"))
  );
}

async function download(url, id, attempt = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  let r;
  try {
    r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
  if (r.status === 429 && attempt < 5) {
    await sleep(1800 * (attempt + 1));
    return download(url, id, attempt + 1);
  }
  if (!r.ok) throw new Error(`img HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  let ext = (url.split("?")[0].match(/\.(jpe?g|png|webp)$/i)?.[1] || "jpg").toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  const file = `${id}.${ext}`;
  await fs.writeFile(path.join(OUT_DIR, file), buf);
  return file;
}

async function pool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function existingFiles() {
  const m = new Map();
  try {
    for (const f of await fs.readdir(OUT_DIR)) {
      const id = f.split(".")[0];
      if (id) m.set(id, f);
    }
  } catch {
    /* klasör yok */
  }
  return m;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const args = process.argv.slice(2);
  const teams =
    args.length === 0
      ? [{ id: "465", name: "Türkiye" }]
      : args[0] === "all"
        ? await allTeams()
        : args.map((id) => ({ id, name: id }));

  const have = await existingFiles();
  const manifest = Object.fromEntries(have); // mevcut fotoğrafları koru
  let total = 0,
    downloaded = 0,
    skipped = 0;
  const misses = [];

  console.log(`${teams.length} takım işlenecek (eşzamanlılık ${CONCURRENCY}).`);
  for (const team of teams) {
    let players = [];
    try {
      players = await roster(team.id);
    } catch (e) {
      console.log(`! ${team.name} (${team.id}) kadro alınamadı: ${e.message}`);
      continue;
    }
    let teamNew = 0,
      teamHave = 0;
    await pool(players, CONCURRENCY, async (p) => {
      total++;
      if (have.has(p.id)) {
        skipped++;
        teamHave++;
        return;
      }
      await sleep(120); // Wikimedia'ya nazik ol
      try {
        const img = await findImage(p);
        if (img) {
          const file = await download(img, p.id);
          manifest[p.id] = file;
          downloaded++;
          teamNew++;
        } else {
          misses.push(`${team.name}: ${p.name}`);
        }
      } catch (e) {
        misses.push(`${team.name}: ${p.name} (${e.message})`);
      }
    });
    console.log(
      `✓ ${team.name} (${team.id}): +${teamNew} yeni, ${teamHave} mevcut / ${players.length}`,
    );
  }

  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((k) => [k, manifest[k]]),
  );
  const body =
    `// OTOMATIK ÜRETİLDİ — scripts/fetch-player-photos.mjs\n` +
    `// Kaynak: Wikipedia / Wikimedia Commons (CC lisanslı). athleteId -> public/players/ dosyası.\n` +
    `export const PLAYER_PHOTOS: Record<string, string> = ${JSON.stringify(sorted, null, 2)};\n`;
  await fs.writeFile(MANIFEST, body);

  console.log(
    `\nTOPLAM: ${Object.keys(sorted).length} fotoğraf (yeni ${downloaded}, mevcut ${skipped}) / ${total} oyuncu`,
  );
  console.log(`Eksik: ${misses.length}`);
  if (misses.length) console.log(misses.slice(0, 60).join("\n"));
}

main().catch((e) => {
  console.error("Beklenmeyen hata:", e);
  process.exit(1);
});
