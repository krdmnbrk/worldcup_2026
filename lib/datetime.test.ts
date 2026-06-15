import { describe, it, expect } from "vitest";
import {
  ymdUTC,
  istanbulDayKey,
  dayDiffFromNow,
  relativeDayLabel,
  isPast,
} from "@/lib/datetime";

// İstanbul kalıcı olarak UTC+3'tür (2016'dan beri DST yok).
describe("ymdUTC", () => {
  it("UTC tabanlı YYYYMMDD", () =>
    expect(ymdUTC(new Date("2026-06-15T10:00:00Z"))).toBe("20260615"));
  it("ay/gün sıfır dolgusu", () =>
    expect(ymdUTC(new Date("2026-07-01T23:59:00Z"))).toBe("20260701"));
});

describe("istanbulDayKey", () => {
  it("öğlen aynı gün", () =>
    expect(istanbulDayKey("2026-06-15T10:00:00Z")).toBe("2026-06-15"));
  it("UTC gece yarısı sonrası İstanbul ertesi güne sarkar", () =>
    // 22:30Z → İstanbul 01:30 ertesi gün
    expect(istanbulDayKey("2026-06-15T22:30:00Z")).toBe("2026-06-16"));
});

describe("dayDiffFromNow / relativeDayLabel", () => {
  const now = new Date("2026-06-15T12:00:00Z"); // İstanbul 15:00, 2026-06-15

  it("bugün = 0", () =>
    expect(dayDiffFromNow("2026-06-15T18:00:00Z", now)).toBe(0));
  it("yarın = 1", () =>
    expect(dayDiffFromNow("2026-06-16T09:00:00Z", now)).toBe(1));
  it("iki gün sonra = 2", () =>
    expect(dayDiffFromNow("2026-06-17T09:00:00Z", now)).toBe(2));

  it("Bugün etiketi", () =>
    expect(relativeDayLabel("2026-06-15T18:00:00Z", now)).toBe("Bugün"));
  it("Yarın etiketi", () =>
    expect(relativeDayLabel("2026-06-16T09:00:00Z", now)).toBe("Yarın"));
  it("Dün etiketi", () =>
    expect(relativeDayLabel("2026-06-14T09:00:00Z", now)).toBe("Dün"));
});

describe("isPast", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  it("geçmiş", () => expect(isPast("2026-06-15T11:00:00Z", now)).toBe(true));
  it("gelecek", () => expect(isPast("2026-06-15T13:00:00Z", now)).toBe(false));
});
