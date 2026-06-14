// ESPN uç sağlık kontrolü. Çalıştır: node scripts/check-espn.mjs
// UI'dan bağımsız olarak uçların gerçek WC2026 verisi döndürdüğünü doğrular.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function get(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function line(s) {
  console.log(s);
}

async function main() {
  let ok = 0;
  let fail = 0;
  const pass = (m) => {
    ok++;
    line("  ✓ " + m);
  };
  const bad = (m) => {
    fail++;
    line("  ✗ " + m);
  };

  // 1) scoreboard farklı pencereler
  line("\n[1] Scoreboard (fikstür/skor/olay)");
  for (const range of [
    "20260611-20260614",
    "20260611-20260617",
    "20260611-20260719",
  ]) {
    try {
      const j = await get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${range}`,
      );
      const n = (j.events || []).length;
      line(`  - dates=${range}: ${n} maç`);
      if (range === "20260611-20260614" && n > 0) {
        const ev = j.events[0];
        const c = ev.competitions[0];
        const comp = c.competitors;
        const h = comp.find((x) => x.homeAway === "home");
        const a = comp.find((x) => x.homeAway === "away");
        pass(
          `örnek: ${h.team.displayName} ${h.score}-${a.score} ${a.team.displayName} | ${c.status.type.shortDetail} | ${c.venue?.fullName} (${c.venue?.address?.city}) | ${c.altGameNote}`,
        );
        const goal = (c.details || []).find((d) => d.scoringPlay);
        if (goal)
          pass(
            `gol: ${goal.athletesInvolved?.[0]?.displayName} ${goal.clock?.displayValue} (id ${goal.athletesInvolved?.[0]?.id})`,
          );
      }
    } catch (e) {
      bad(`scoreboard ${range}: ${e.message}`);
    }
  }

  // 2) standings
  line("\n[2] Standings (grup tabloları)");
  try {
    const j = await get(
      "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026",
    );
    const groups = j.children || [];
    line(`  - ${groups.length} grup`);
    if (groups.length) {
      const g = groups[0];
      const e = g.standings?.entries?.[0];
      const pts = e?.stats?.find((s) => s.name === "points");
      pass(
        `${g.name}: ilk sıra ${e?.team?.displayName}, P=${pts?.displayValue}`,
      );
    } else bad("standings boş");
  } catch (e) {
    bad(`standings: ${e.message}`);
  }

  // 3) summary
  line("\n[3] Summary (kadro/istatistik) event=760415");
  try {
    const j = await get(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=760415",
    );
    const rosters = j.rosters || j.boxscore?.rosters || [];
    const starters = (rosters[0]?.roster || []).filter((p) => p.starter).length;
    const stats = j.boxscore?.teams?.[0]?.statistics?.length || 0;
    const ref = (j.gameInfo?.officials || []).find(
      (o) => o.position?.name === "Referee",
    )?.fullName;
    if (rosters.length) pass(`kadro: ${rosters.length} takım, ${starters} ilk 11`);
    else bad("kadro yok");
    pass(`boxscore istatistik sayısı: ${stats}, hakem: ${ref}`);
  } catch (e) {
    bad(`summary: ${e.message}`);
  }

  // 4) teams
  line("\n[4] Teams");
  try {
    const j = await get(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams",
    );
    const teams = j.sports?.[0]?.leagues?.[0]?.teams || [];
    pass(`${teams.length} takım`);
    const tur = teams.find((w) => w.team?.abbreviation === "TUR");
    if (tur) pass(`Türkiye bulundu: id ${tur.team.id}`);
  } catch (e) {
    bad(`teams: ${e.message}`);
  }

  // 5) formation (core)
  line("\n[5] Formation (core API) event=760415");
  try {
    const j = await get(
      "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/events/760415/competitions/760415/competitors/203/roster",
    );
    if (j.formation?.summary) pass(`diziliş: ${j.formation.summary}`);
    else bad("formation.summary yok");
  } catch (e) {
    bad(`formation: ${e.message}`);
  }

  line(`\nSonuç: ${ok} geçti, ${fail} başarısız`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Beklenmeyen hata:", e);
  process.exit(1);
});
