import { describe, it, expect } from "vitest";
import { computeQualification } from "@/lib/data";
import type { GroupStanding, StandingRow, Team } from "@/lib/domain/types";

function team(id: string, name: string): Team {
  return { id, name, abbr: name.slice(0, 3).toUpperCase(), logo: "" };
}

function row(
  t: Team,
  s: { points: number; gd: number; gf: number; played?: number; rank: number },
): StandingRow {
  return {
    team: t,
    played: s.played ?? 3,
    w: 0,
    d: 0,
    l: 0,
    gf: s.gf,
    ga: 0,
    gd: s.gd,
    points: s.points,
    rank: s.rank,
  };
}

// 4 takımlı bir grup; 3. sıra istatistikleri parametreyle verilir.
function group(
  id: string,
  third: { points: number; gd: number; gf: number; name?: string },
): GroupStanding {
  const third3 = row(team(`${id}3`, third.name ?? `${id}-3rd`), {
    points: third.points,
    gd: third.gd,
    gf: third.gf,
    rank: 3,
  });
  return {
    groupId: id,
    groupName: `Grup ${id}`,
    rows: [
      row(team(`${id}1`, `${id}-1st`), { points: 9, gd: 5, gf: 8, rank: 1 }),
      row(team(`${id}2`, `${id}-2nd`), { points: 6, gd: 2, gf: 5, rank: 2 }),
      third3,
      row(team(`${id}4`, `${id}-4th`), { points: 0, gd: -7, gf: 1, rank: 4 }),
    ],
    provisional: false,
  };
}

const LETTERS = "ABCDEFGHIJKL".split("");

describe("computeQualification — grup atamaları", () => {
  const standings = LETTERS.map((L, i) =>
    group(L, { points: 12 - i, gd: 0, gf: 0 }),
  );
  const q = computeQualification(standings);

  it("kazanan/ikinci/üçüncü doğru satırlardan alınır", () => {
    expect(q.groups[0].winner?.id).toBe("A1");
    expect(q.groups[0].runnerUp?.id).toBe("A2");
    expect(q.groups[0].third?.team.id).toBe("A3");
  });

  it("12 grup ve hepsi tamamsa complete=true", () =>
    expect(q.complete).toBe(true));
});

describe("computeQualification — en iyi 8 üçüncü sıralaması", () => {
  // A en yüksek puan (12) ... L en düşük (1)
  const standings = LETTERS.map((L, i) =>
    group(L, { points: 12 - i, gd: 0, gf: 0 }),
  );
  const q = computeQualification(standings);

  it("puana göre azalan sıralanır", () => {
    expect(q.thirds.map((t) => t.groupId)).toEqual(LETTERS);
  });

  it("yalnızca ilk 8 üçüncü tur atlar", () => {
    expect(q.thirds.filter((t) => t.qualifies).map((t) => t.groupId)).toEqual(
      LETTERS.slice(0, 8),
    );
    expect(q.thirds.slice(8).every((t) => !t.qualifies)).toBe(true);
  });
});

describe("computeQualification — eşitlik bozucular", () => {
  it("puan eşitse averaj (gd) belirler", () => {
    const q = computeQualification([
      group("X", { points: 4, gd: 1, gf: 5 }),
      group("Y", { points: 4, gd: 3, gf: 2 }),
    ]);
    expect(q.thirds[0].groupId).toBe("Y"); // daha yüksek averaj
  });

  it("puan+averaj eşitse atılan gol (gf) belirler", () => {
    const q = computeQualification([
      group("X", { points: 4, gd: 2, gf: 3 }),
      group("Y", { points: 4, gd: 2, gf: 7 }),
    ]);
    expect(q.thirds[0].groupId).toBe("Y"); // daha çok gol
  });

  it("her şey eşitse takım adına göre alfabetik", () => {
    const q = computeQualification([
      group("X", { points: 4, gd: 2, gf: 5, name: "Zeta" }),
      group("Y", { points: 4, gd: 2, gf: 5, name: "Beta" }),
    ]);
    expect(q.thirds[0].groupId).toBe("Y"); // "Beta" < "Zeta"
  });

  it("12'den az grup → complete=false", () => {
    const q = computeQualification([group("A", { points: 4, gd: 1, gf: 3 })]);
    expect(q.complete).toBe(false);
  });
});
