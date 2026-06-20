import { describe, it, expect } from "vitest";
import { mergeMatchesById } from "@/lib/espn/browser";
import type { Match } from "@/lib/domain/types";

const m = (id: string, date: string, extra: Partial<Match> = {}): Match =>
  ({
    id,
    date,
    home: { id: "h", name: "H", abbr: "H" },
    away: { id: "a", name: "A", abbr: "A" },
    status: "pre",
    ...extra,
  }) as Match;

describe("mergeMatchesById", () => {
  it("taze maç skorunu baseline üzerine bindirir", () => {
    const baseline = [m("1", "2026-06-20T15:00:00Z", { status: "pre" })];
    const updates = [
      m("1", "2026-06-20T15:00:00Z", {
        status: "in",
        home: { id: "h", name: "H", abbr: "H", score: 1 } as Match["home"],
      }),
    ];
    const out = mergeMatchesById(baseline, updates);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe("in");
    expect(out[0].home.score).toBe(1);
  });

  it("baseline'da olmayan yeni maçı ekler ve tarihe göre sıralar", () => {
    const baseline = [m("2", "2026-06-21T15:00:00Z")];
    const updates = [m("1", "2026-06-20T15:00:00Z")];
    const out = mergeMatchesById(baseline, updates);
    expect(out.map((x) => x.id)).toEqual(["1", "2"]);
  });

  it("güncellenmeyen baseline maçlarına dokunmaz", () => {
    const baseline = [
      m("1", "2026-06-19T15:00:00Z", { status: "post" }),
      m("2", "2026-06-20T15:00:00Z", { status: "pre" }),
    ];
    const updates = [m("2", "2026-06-20T15:00:00Z", { status: "in" })];
    const out = mergeMatchesById(baseline, updates);
    expect(out.find((x) => x.id === "1")?.status).toBe("post");
    expect(out.find((x) => x.id === "2")?.status).toBe("in");
  });

  it("boş güncellemede baseline'ı korur", () => {
    const baseline = [m("1", "2026-06-20T15:00:00Z")];
    expect(mergeMatchesById(baseline, [])).toEqual(baseline);
  });
});
