import { describe, it, expect } from "vitest";
import { parse, tickText, isFrozen, isHalftime } from "@/lib/liveclock";

describe("parse (displayClock ayrıştırma)", () => {
  it("düz dakika", () => expect(parse("67'")).toEqual({ base: 67, plus: null }));
  it("apostrofsuz düz", () => expect(parse("67")).toEqual({ base: 67, plus: null }));
  it("uzatma 45'+2'", () => expect(parse("45'+2'")).toEqual({ base: 45, plus: 2 }));
  it("boşluklu uzatma 90' + 8'", () =>
    expect(parse("90' + 8'")).toEqual({ base: 90, plus: 8 }));
  it("apostrofsuz uzatma 45+3", () =>
    expect(parse("45+3")).toEqual({ base: 45, plus: 3 }));
  it("sayısal olmayan → null", () => expect(parse("HT")).toBeNull());
  it("boş → null", () => expect(parse("")).toBeNull());
});

describe("tickText (yerel ileri sayım)", () => {
  it("normal oyunda ana dakika artar", () =>
    expect(tickText({ base: 67, plus: null }, 1)).toBe("68'"));
  it("uzatmada '+' kısmı artar", () =>
    expect(tickText({ base: 45, plus: 2 }, 1)).toBe("45'+3'"));
  it("90'+8' + 2 dk → 90'+10'", () =>
    expect(tickText({ base: 90, plus: 8 }, 2)).toBe("90'+10'"));
  it("0 dk geçtiyse aynı kalır", () =>
    expect(tickText({ base: 30, plus: null }, 0)).toBe("30'"));
  it("negatif elapsed sıfıra kırpılır (poll re-sync)", () =>
    expect(tickText({ base: 50, plus: null }, -5)).toBe("50'"));
});

describe("isFrozen / isHalftime", () => {
  it("devam eden maç donmaz", () =>
    expect(isFrozen("STATUS_SECOND_HALF")).toBe(false));
  it("bitiş donar", () => expect(isFrozen("STATUS_FULL_TIME")).toBe(true));
  it("penaltı donar", () => expect(isFrozen("STATUS_SHOOTOUT")).toBe(true));
  it("devre arası hem frozen hem halftime", () => {
    expect(isFrozen("STATUS_HALFTIME")).toBe(true);
    expect(isHalftime("STATUS_HALFTIME")).toBe(true);
  });
  it("ikinci yarı halftime değil", () =>
    expect(isHalftime("STATUS_SECOND_HALF")).toBe(false));
  it("tanımsız statü donmaz", () => expect(isFrozen(undefined)).toBe(false));
});
