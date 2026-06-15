// Canlı maç saati — saf, test edilebilir mantık (LiveClock bileşeninden ayrı).
// ESPN'in displayClock'unu (ör. "67'", "45'+2'") ayrıştırır ve son veri anından
// bu yana geçen dakikayı ekleyerek gösterilecek metni üretir.

export interface ParsedClock {
  base: number;
  plus: number | null;
}

// Sayaç bu durumlarda durur (devre arası, bitiş, penaltı, ertelenme vb.).
const FROZEN =
  /HALFTIME|HALF_TIME|END|FULL|SHOOTOUT|PENALT|DELAY|ABANDON|SUSPEND/i;
const HALFTIME = /HALFTIME|HALF_TIME/i;

export function isFrozen(statusName?: string): boolean {
  return FROZEN.test(statusName || "");
}

export function isHalftime(statusName?: string): boolean {
  return HALFTIME.test(statusName || "");
}

// "67'" → {67,null}; "45'+2'" → {45,2}; "90' + 8'" → {90,8}; "45+3" → {45,3}.
export function parse(dc: string): ParsedClock | null {
  const m = dc.match(/^(\d+)'?(?:\s*\+\s*(\d+)'?)?/);
  if (!m) return null;
  return {
    base: parseInt(m[1], 10),
    plus: m[2] != null ? parseInt(m[2], 10) : null,
  };
}

// Anchor'dan bu yana geçen dakikayı ekleyerek gösterilecek metni üretir.
// Uzatmada (+x) artış '+' kısmına, normal oyunda ana dakikaya eklenir.
export function tickText(parsed: ParsedClock, elapsedMin: number): string {
  const e = Math.max(0, elapsedMin);
  const tick = (parsed.plus != null ? parsed.plus : parsed.base) + e;
  return parsed.plus != null ? `${parsed.base}'+${tick}'` : `${tick}'`;
}
