import { describe, it, expect } from "vitest";
import {
  parseMinute,
  normalizeStandings,
  normalizeStandingsFallback,
  normalizeTeams,
  normalizeScoreboard,
  normalizeSummary,
  normalizeRoster,
  normalizeAthlete,
  normalizePreview,
} from "@/lib/espn/normalize";
import type { Team } from "@/lib/domain/types";

describe("parseMinute", () => {
  it("düz dakika", () => expect(parseMinute("90'")).toBe(90));
  it("apostrofsuz", () => expect(parseMinute("67")).toBe(67));
  it("uzatma kesir olarak kodlanır (sıralama için)", () =>
    expect(parseMinute("45'+2'")).toBeCloseTo(45.02, 5));
  it("90+6 → 90.06", () => expect(parseMinute("90'+6'")).toBeCloseTo(90.06, 5));
  it("tanımsız → 0", () => expect(parseMinute(undefined)).toBe(0));
  it("geçersiz → 0", () => expect(parseMinute("HT")).toBe(0));
  it("Math.floor ile taban dakikaya iner (kova için)", () =>
    expect(Math.floor(parseMinute("45'+2'"))).toBe(45));
});

// ESPN apis/v2 standings şekli
const standingsFixture = {
  children: [
    {
      id: "1",
      name: "Group A",
      standings: {
        entries: [
          {
            team: { id: "10", displayName: "Brezilya", abbreviation: "BRA" },
            stats: [
              { name: "gamesPlayed", value: 3 },
              { name: "wins", value: 3 },
              { name: "ties", value: 0 },
              { name: "losses", value: 0 },
              { name: "pointsFor", value: 7 },
              { name: "pointsAgainst", value: 2 },
              { name: "pointDifferential", value: 5 },
              { name: "points", value: 9 },
              { name: "rank", value: 1 },
            ],
          },
          {
            team: { id: "11", displayName: "Sırbistan", abbreviation: "SRB" },
            stats: [
              { name: "gamesPlayed", value: 3 },
              { name: "points", value: 4 },
              { name: "pointsFor", value: 4 },
              { name: "pointsAgainst", value: 5 },
              { name: "pointDifferential", value: -1 },
              { name: "rank", value: 2 },
            ],
          },
        ],
      },
    },
  ],
};

describe("normalizeStandings", () => {
  const groups = normalizeStandings(standingsFixture);

  it("grup kimliği/adı 'Group A' notundan çıkarılır", () => {
    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe("A");
    expect(groups[0].groupName).toBe("Grup A");
  });

  it("gol alanları isimle doğru eşlenir", () => {
    const bra = groups[0].rows[0];
    expect(bra.team.name).toBe("Brezilya");
    expect(bra.played).toBe(3);
    expect(bra.gf).toBe(7);
    expect(bra.ga).toBe(2);
    expect(bra.gd).toBe(5);
    expect(bra.points).toBe(9);
    expect(bra.rank).toBe(1);
  });

  it("rank'e göre sıralı (BRA önce)", () =>
    expect(groups[0].rows.map((r) => r.team.abbr)).toEqual(["BRA", "SRB"]));

  it("hepsi 3 maç oynadıysa provisional=false", () =>
    expect(groups[0].provisional).toBe(false));

  it("eksik veride boş dizi", () =>
    expect(normalizeStandings({})).toEqual([]));
});

// cdn.espn yedek şekli (kısaltma tabanlı stats)
const fallbackFixture = {
  standings: {
    groups: [
      {
        id: "2",
        name: "Group B",
        standings: {
          entries: [
            {
              team: { id: "20", displayName: "Arjantin", abbreviation: "ARG" },
              stats: [
                { abbreviation: "GP", value: 2 },
                { abbreviation: "F", value: 4 },
                { abbreviation: "A", value: 1 },
                { abbreviation: "GD", value: 3 },
                { abbreviation: "P", value: 6 },
              ],
              note: { rank: 1 },
            },
          ],
        },
      },
    ],
  },
};

describe("normalizeStandingsFallback", () => {
  const groups = normalizeStandingsFallback(fallbackFixture);
  it("kısaltma tabanlı gol alanları (F/A/GD)", () => {
    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe("B");
    const arg = groups[0].rows[0];
    expect(arg.gf).toBe(4);
    expect(arg.ga).toBe(1);
    expect(arg.gd).toBe(3);
    expect(arg.points).toBe(6);
    expect(arg.played).toBe(2);
  });
  it("2 maç oynandıysa provisional=true", () =>
    expect(groups[0].provisional).toBe(true));
});

describe("normalizeTeams", () => {
  const teams = normalizeTeams({
    sports: [
      {
        leagues: [
          {
            teams: [
              {
                team: {
                  id: "30",
                  displayName: "Türkiye",
                  abbreviation: "TUR",
                  logos: [{ href: "https://x/tur.png" }],
                  color: "E30A17",
                },
              },
            ],
          },
        ],
      },
    ],
  });
  it("takım alanları eşlenir + logo + renk #'li", () => {
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject({
      id: "30",
      name: "Türkiye",
      abbr: "TUR",
      logo: "https://x/tur.png",
      colorHex: "#E30A17",
    });
  });
  it("eksik veride boş dizi", () => expect(normalizeTeams({})).toEqual([]));
});

// ESPN scoreboard şekli (tek maç: Meksika 2-0 Güney Afrika, gol + sarı kart)
const scoreboardFixture = {
  leagues: [{ season: { type: { abbreviation: "grp", name: "Group Stage" } } }],
  events: [
    {
      id: "760415",
      date: "2026-06-15T18:00:00Z",
      season: { slug: "group-stage" },
      competitions: [
        {
          altGameNote: "FIFA World Cup, Group A",
          attendance: 50000,
          status: {
            type: {
              state: "post",
              name: "STATUS_FULL_TIME",
              shortDetail: "FT",
              completed: true,
            },
            displayClock: "90'",
          },
          venue: {
            fullName: "Estadio Azteca",
            address: { city: "Mexico City", country: "Mexico" },
          },
          broadcasts: [{ names: ["TRT 1"] }],
          competitors: [
            {
              homeAway: "home",
              score: "2",
              winner: true,
              team: { id: "10", displayName: "Meksika", abbreviation: "MEX", color: "006847" },
            },
            {
              homeAway: "away",
              score: "0",
              team: { id: "11", displayName: "Güney Afrika", abbreviation: "RSA" },
            },
          ],
          details: [
            {
              type: { text: "Goal" },
              scoringPlay: true,
              clock: { displayValue: "9'" },
              team: { id: "10" },
              athletesInvolved: [{ id: "500", displayName: "Quiñones" }],
            },
            {
              type: { text: "Yellow Card" },
              yellowCard: true,
              clock: { displayValue: "45'+2'" },
              team: { id: "11" },
              athletesInvolved: [{ id: "600", displayName: "Mokoena" }],
            },
          ],
        },
      ],
    },
  ],
};

describe("normalizeScoreboard", () => {
  const matches = normalizeScoreboard(scoreboardFixture);
  const m = matches[0];

  it("temel maç alanları", () => {
    expect(matches).toHaveLength(1);
    expect(m.id).toBe("760415");
    expect(m.status).toBe("post");
    expect(m.statusName).toBe("STATUS_FULL_TIME");
    expect(m.clock).toBe("90'");
    expect(m.completed).toBe(true);
  });

  it("ev/deplasman homeAway ile + skorlar sayıya çevrilir", () => {
    expect(m.home.name).toBe("Meksika");
    expect(m.home.score).toBe(2);
    expect(m.away.name).toBe("Güney Afrika");
    expect(m.away.score).toBe(0);
    expect(m.home.colorHex).toBe("#006847");
  });

  it("grup + aşama + roundLabel", () => {
    expect(m.group).toBe("A");
    expect(m.stage).toBe("group");
    expect(m.roundLabel).toBe("Grup A");
  });

  it("venue + seyirci + yayın", () => {
    expect(m.venue.name).toBe("Estadio Azteca");
    expect(m.venue.city).toBe("Mexico City");
    expect(m.attendance).toBe(50000);
    expect(m.broadcasts).toEqual(["TRT 1"]);
  });

  it("olaylar tipli + dakikaya göre sıralı", () => {
    expect(m.events).toHaveLength(2);
    expect(m.events[0]).toMatchObject({
      type: "goal",
      player: "Quiñones",
      playerId: "500",
      minute: "9'",
    });
    expect(m.events[1]).toMatchObject({ type: "yellow", player: "Mokoena" });
  });

  it("eksik veride boş dizi", () => expect(normalizeScoreboard({})).toEqual([]));
});

describe("normalizeSummary", () => {
  const sum = normalizeSummary({
    rosters: [
      {
        team: { id: "10" },
        roster: [
          {
            starter: true,
            jersey: "9",
            position: { abbreviation: "F" },
            formationPlace: "9",
            captain: true,
            athlete: { id: "500", displayName: "Quiñones", headshot: { href: "h" } },
            stats: [
              { name: "goalAssists", value: 1 },
              { name: "totalGoals", value: 1 },
            ],
          },
          {
            starter: false,
            jersey: "20",
            position: { abbreviation: "M" },
            athlete: { id: "501", displayName: "Yedek" },
          },
        ],
      },
    ],
    boxscore: {
      teams: [
        {
          homeAway: "home",
          statistics: [{ name: "possessionPct", displayValue: "60", label: "Possession" }],
        },
        { homeAway: "away", statistics: [{ name: "possessionPct", displayValue: "40" }] },
      ],
    },
    gameInfo: {
      officials: [{ position: { name: "Referee" }, fullName: "Mr Whistle" }],
      attendance: 50000,
    },
    article: { headline: "Büyük galibiyet", story: "<p>Meksika &amp; kazandı</p>" },
  });

  it("kadro starter/sub ayrımı + kaptan + maç istatistiği", () => {
    expect(sum.lineups[0].teamId).toBe("10");
    expect(sum.lineups[0].starters).toHaveLength(1);
    expect(sum.lineups[0].subs).toHaveLength(1);
    const cap = sum.lineups[0].starters[0];
    expect(cap.captain).toBe(true);
    expect(cap.stats?.assists).toBe(1);
    expect(cap.stats?.goals).toBe(1);
  });

  it("takım istatistiği home/away değerleri", () => {
    const poss = sum.teamStats.find((s) => s.name === "possessionPct");
    expect(poss?.home).toBe("60");
    expect(poss?.away).toBe("40");
  });

  it("hakem + seyirci + recap (HTML temizlenir)", () => {
    expect(sum.referee).toBe("Mr Whistle");
    expect(sum.attendance).toBe(50000);
    expect(sum.recap?.headline).toBe("Büyük galibiyet");
    expect(sum.recap?.text).toBe("Meksika & kazandı");
  });
});

describe("normalizeRoster / normalizeAthlete (lbs→kg, inch→cm)", () => {
  const team: Team = { id: "10", name: "Meksika", abbr: "MEX", logo: "l" };
  it("roster: boy/kilo metrik + takım bilgisi", () => {
    const [p] = normalizeRoster(
      {
        athletes: [
          {
            id: "500",
            displayName: "Quiñones",
            position: { name: "Forward" },
            jersey: "9",
            height: 70,
            weight: 154,
            citizenship: "Mexico",
            headshot: { href: "h" },
          },
        ],
      },
      team,
    );
    expect(p.height).toBe("178 cm"); // 70 inch
    expect(p.weight).toBe("70 kg"); // 154 lbs
    expect(p.teamId).toBe("10");
    expect(p.teamAbbr).toBe("MEX");
  });

  it("athlete: kulüp + sezon istatistikleri", () => {
    const a = normalizeAthlete({
      athlete: {
        id: "500",
        displayName: "Quiñones",
        height: 70,
        weight: 154,
        team: { name: "Club X" },
        statistics: {
          splits: { categories: [{ stats: [{ displayName: "Goller", displayValue: "5" }] }] },
        },
      },
    });
    expect(a.club).toBe("Club X");
    expect(a.height).toBe("178 cm");
    expect(a.seasonStats?.[0]).toEqual({ label: "Goller", value: "5" });
  });
});

describe("normalizePreview", () => {
  const p = normalizePreview({
    odds: [{ provider: { name: "BetX" }, details: "MEX -1", overUnder: 2.5 }],
    lastFiveGames: [
      {
        team: { id: "10" },
        events: [
          {
            gameResult: "W",
            gameDate: "2026-06-01",
            score: "2-0",
            opponent: { displayName: "Foo" },
            leagueAbbreviation: "WC",
          },
        ],
      },
    ],
    headToHeadGames: [
      { events: [{ gameResult: "D", gameDate: "2025-01-01", score: "1-1", opponent: "Bar" }] },
    ],
  });
  it("oran + form + H2H", () => {
    expect(p.odds?.provider).toBe("BetX");
    expect(p.odds?.overUnder).toBe("2.5");
    expect(p.teamForm[0].teamId).toBe("10");
    expect(p.teamForm[0].games[0].result).toBe("W");
    expect(p.h2h[0].result).toBe("D");
  });
});
