import { describe, it, expect } from "vitest";
import { buildICS } from "@/lib/ics";

describe("buildICS", () => {
  const base = {
    id: "760415",
    start: "2026-06-15T18:00:00Z",
    title: "Meksika - Güney Afrika",
    location: "Estadio Azteca, Mexico City",
  };

  it("geçerli VCALENDAR/VEVENT iskeleti üretir", () => {
    const ics = buildICS([base]);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("UID:wc2026-760415@krdmnbrk.github.io");
    expect(ics).toContain("DTSTART:20260615T180000Z");
    expect(ics).toContain("SUMMARY:Meksika - Güney Afrika");
    // satırlar CRLF ile birleşir (RFC 5545)
    expect(ics).toContain("\r\n");
  });

  it("özel karakterleri kaçırır (; , \\)", () => {
    const ics = buildICS([{ ...base, title: "A; B, C\\D" }]);
    expect(ics).toContain("SUMMARY:A\\; B\\, C\\\\D");
  });

  it("CRLF/LF enjeksiyonu yeni satır/property üretemez", () => {
    const ics = buildICS([
      { ...base, title: "Evil\r\nSUMMARY:Hacked\nLine" },
    ]);
    // \r\n ve \n tek "\n" dizisine katlanır → gerçek satır kırılmaz
    expect(ics).toContain("SUMMARY:Evil\\nSUMMARY:Hacked\\nLine");
    // "SUMMARY:Hacked" başlı başına bir satır OLMAMALI
    const lines = ics.split("\r\n");
    expect(lines.some((l) => l === "SUMMARY:Hacked")).toBe(false);
    // tam olarak bir SUMMARY satırı olmalı
    expect(lines.filter((l) => l.startsWith("SUMMARY:")).length).toBe(1);
  });

  it("start'sız etkinliği atlar", () => {
    const ics = buildICS([{ ...base, start: "" }]);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
