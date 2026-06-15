// Takıma özel telefon duvar kâğıdı — tamamen vektörel (SVG), harici servis/anahtar
// yok. Takım renklerinden üretilir; PNG'ye tarayıcıda canvas ile rasterize edilir.
// Saf fonksiyonlar (test edilebilir); DOM/fetch yok.

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

export type WallpaperStyle = "gradyan" | "saha" | "cizgili" | "yildiz";

export const WALLPAPER_STYLES: { key: WallpaperStyle; label: string }[] = [
  { key: "gradyan", label: "Gradyan" },
  { key: "saha", label: "Saha" },
  { key: "cizgili", label: "Çizgili" },
  { key: "yildiz", label: "Yıldız" },
];

// ---- renk yardımcıları ----
function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => clampByte(x).toString(16).padStart(2, "0"))
      .join("")
  );
}
// amt < 0 koyulaştırır, > 0 beyaza doğru açar (-1..1)
export function shade(hex: string, amt: number): string {
  const { r, g, b } = parseHex(hex);
  if (amt >= 0)
    return toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return toHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function isHex6(c?: string): boolean {
  return !!c && /^#?[0-9a-f]{6}$/i.test(c.trim());
}
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

// Ünlü milli takımlar için elle seçilmiş canlı paletler (primary + accent).
const CURATED: Record<string, { primary: string; accent: string }> = {
  TUR: { primary: "#E30A17", accent: "#ffffff" },
  BRA: { primary: "#009739", accent: "#FFDF00" },
  ARG: { primary: "#5EA9DD", accent: "#ffffff" },
  FRA: { primary: "#002654", accent: "#ED2939" },
  GER: { primary: "#16181d", accent: "#FFCE00" },
  ESP: { primary: "#C60B1E", accent: "#FFC400" },
  ENG: { primary: "#0B1F4D", accent: "#ffffff" },
  POR: { primary: "#046A38", accent: "#DA291C" },
  NED: { primary: "#F36C21", accent: "#ffffff" },
  USA: { primary: "#0A3161", accent: "#B31942" },
  MEX: { primary: "#006847", accent: "#CE1126" },
  CAN: { primary: "#D52B1E", accent: "#ffffff" },
  BEL: { primary: "#16181d", accent: "#FDDA24" },
  CRO: { primary: "#C8102E", accent: "#ffffff" },
  URU: { primary: "#3F7DC6", accent: "#FCD116" },
  COL: { primary: "#1A3D8F", accent: "#FCD116" },
  JPN: { primary: "#1A2A6C", accent: "#BC002D" },
  KOR: { primary: "#0F3DA3", accent: "#CD2E3A" },
  AUS: { primary: "#00843D", accent: "#FFCD00" },
  MAR: { primary: "#C1272D", accent: "#006233" },
  SEN: { primary: "#00853F", accent: "#FDEF42" },
  SUI: { primary: "#D52B1E", accent: "#ffffff" },
  GHA: { primary: "#006B3F", accent: "#FCD116" },
  NGA: { primary: "#008751", accent: "#ffffff" },
  EGY: { primary: "#C8102E", accent: "#ffffff" },
  KSA: { primary: "#165D31", accent: "#ffffff" },
  IRN: { primary: "#239F40", accent: "#DA0000" },
  ECU: { primary: "#1f4ea1", accent: "#FFD100" },
  PAR: { primary: "#D52B1E", accent: "#0038A8" },
};

export function resolvePalette(abbr: string, colorHex?: string): Palette {
  const c = CURATED[(abbr || "").toUpperCase()];
  if (c) return { primary: c.primary, secondary: shade(c.primary, -0.45), accent: c.accent };
  if (isHex6(colorHex)) {
    const p = "#" + colorHex!.replace(/^#/, "");
    return { primary: p, secondary: shade(p, -0.45), accent: shade(p, 0.55) };
  }
  // Renk yoksa kısaltmadan deterministik ton üret.
  let hue = 0;
  for (const ch of abbr || "WC") hue = (hue + ch.charCodeAt(0) * 7) % 360;
  const p = hslToHex(hue, 62, 46);
  return { primary: p, secondary: hslToHex(hue, 66, 26), accent: hslToHex(hue, 58, 72) };
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[
        c
      ] as string,
  );
}

export interface WallpaperOpts {
  name: string; // Türkçe takım adı
  abbr: string;
  palette: Palette;
  style: WallpaperStyle;
  width?: number;
  height?: number;
}

// Stile göre arka plan katmanı (crest + metin ortak olarak üstüne biner).
function background(
  style: WallpaperStyle,
  W: number,
  H: number,
  p: Palette,
): string {
  switch (style) {
    case "saha": {
      // Takım renginde "biçilmiş çim" şeritleri + saha çizgileri.
      const dark = shade(p.primary, -0.35);
      const darker = shade(p.primary, -0.55);
      const bands = Array.from({ length: 12 }, (_, i) => {
        const y = (i * H) / 12;
        return `<rect x="0" y="${y}" width="${W}" height="${H / 12}" fill="${
          i % 2 ? dark : darker
        }"/>`;
      }).join("");
      const cx = W / 2;
      return `${bands}
        <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="rgba(255,255,255,0.25)" stroke-width="6"/>
        <circle cx="${cx}" cy="${H / 2}" r="210" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="6"/>
        <rect x="${cx - 300}" y="${H - 6}" width="600" height="320" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>`;
    }
    case "cizgili": {
      // Kalın çapraz şeritler (forma esintili).
      const w = 150;
      const stripes = [];
      for (let x = -H; x < W + H; x += w * 2) {
        stripes.push(
          `<polygon points="${x},0 ${x + w},0 ${x + w - H},${H} ${x - H},${H}" fill="${p.secondary}"/>`,
        );
      }
      return `<rect width="${W}" height="${H}" fill="${p.primary}"/>${stripes.join("")}`;
    }
    case "yildiz": {
      // Koyu gece + takım rengi parıltı + serpiştirilmiş yıldızlar.
      const stars = [];
      let seed = 7;
      for (let i = 0; i < 60; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const x = seed % W;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const y = seed % H;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const r = 2 + (seed % 5);
        const op = 0.25 + (seed % 60) / 100;
        stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${p.accent}" opacity="${op.toFixed(2)}"/>`);
      }
      return `<rect width="${W}" height="${H}" fill="#080c16"/>
        <radialGradient id="glow" cx="50%" cy="42%" r="60%">
          <stop offset="0" stop-color="${p.primary}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${p.primary}" stop-opacity="0"/>
        </radialGradient>
        <rect width="${W}" height="${H}" fill="url(#glow)"/>${stars.join("")}`;
    }
    case "gradyan":
    default: {
      const ink = luminance(p.primary) > 0.6 ? "#0b1018" : "#ffffff";
      return `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${shade(p.primary, 0.12)}"/>
          <stop offset="1" stop-color="${shade(p.primary, -0.5)}"/>
        </linearGradient>
        <rect width="${W}" height="${H}" fill="url(#g)"/>
        <text x="${W / 2}" y="${H * 0.52}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="760" fill="${ink}" opacity="0.07">⚽</text>`;
    }
  }
}

export function buildWallpaperSVG(o: WallpaperOpts): string {
  const W = o.width ?? 1080;
  const H = o.height ?? 2340;
  const p = o.palette;
  const abbr = esc((o.abbr || "WC").toUpperCase().slice(0, 3));
  const name = esc(o.name || "Takım");
  const cx = W / 2;
  const crestY = 940;
  const R = 250;
  const abbrSize = abbr.length <= 2 ? 250 : 210;
  // Metin her zaman koyu yarı saydam bant + beyaz yazı → her renkte okunur.
  const barY = 1290;
  const barH = 300;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${background(o.style, W, H, p)}
  <g font-family="Arial, Helvetica, sans-serif">
    <circle cx="${cx}" cy="${crestY}" r="${R}" fill="rgba(8,12,20,0.42)" stroke="${p.accent}" stroke-width="12"/>
    <text x="${cx}" y="${crestY + abbrSize * 0.34}" text-anchor="middle" font-weight="800" font-size="${abbrSize}" fill="#ffffff" letter-spacing="4">${abbr}</text>
    <rect x="${cx - 470}" y="${barY}" width="940" height="${barH}" rx="44" fill="rgba(8,12,20,0.5)"/>
    <text x="${cx}" y="${barY + 130}" text-anchor="middle" font-weight="800" font-size="96" fill="#ffffff">${name}</text>
    <text x="${cx}" y="${barY + 220}" text-anchor="middle" font-weight="700" font-size="46" fill="${p.accent}" letter-spacing="8">DÜNYA KUPASI 2026</text>
    <text x="${cx}" y="${H - 150}" text-anchor="middle" font-weight="600" font-size="38" fill="#ffffff" opacity="0.7">FIFA Dünya Kupası · 11 Haz – 19 Tem · Kuzey Amerika</text>
  </g>
</svg>`;
}
