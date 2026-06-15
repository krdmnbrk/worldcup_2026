import { describe, it, expect } from "vitest";
import {
  parseMinute,
  normalizeStandings,
  normalizeStandingsFallback,
  normalizeTeams,
} from "@/lib/espn/normalize";

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
