// Takıma özel telefon duvar kâğıdı — tamamen vektörel (SVG), harici servis/anahtar
// yok. Takım renklerinden üretilir; PNG'ye tarayıcıda canvas ile rasterize edilir.
// Saf fonksiyonlar (test edilebilir); DOM/fetch yok.

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
}

export type WallpaperStyle =
  | "gradyan"
  | "saha"
  | "cizgili"
  | "yildiz"
  | "dalga"
  | "halo"
  | "oyuncu";

export const WALLPAPER_STYLES: { key: WallpaperStyle; label: string }[] = [
  { key: "gradyan", label: "Gradyan" },
  { key: "cizgili", label: "Çizgili" },
  { key: "saha", label: "Saha" },
  { key: "yildiz", label: "Yıldız" },
  { key: "dalga", label: "Dalga" },
  { key: "halo", label: "Halo" },
  { key: "oyuncu", label: "Oyuncu" },
];

// Hedef cihaza göre çıktı boyutları (px).
export const WALLPAPER_SIZES: {
  key: string;
  label: string;
  w: number;
  h: number;
}[] = [
  { key: "telefon", label: "Telefon", w: 1080, h: 2340 },
  { key: "tablet", label: "Tablet", w: 1640, h: 2360 },
  { key: "masaustu", label: "Masaüstü", w: 2560, h: 1440 },
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
  name: string; // takım adı (oyuncu stilinde: oyuncu adı)
  abbr: string;
  palette: Palette;
  style: WallpaperStyle;
  width?: number;
  height?: number;
  photo?: string; // oyuncu stili için data: URI (yerel webp → base64)
  jersey?: string; // oyuncu forma numarası
}

// Stile göre arka plan katmanı (crest + metin ortak olarak üstüne biner).
function background(
  style: WallpaperStyle,
  W: number,
  H: number,
  p: Palette,
): string {
  const S = Math.min(W, H);
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
    case "dalga": {
      // Katmanlı yumuşak dalgalar (takım renk tonları).
      const cols = [
        shade(p.primary, 0.08),
        p.primary,
        shade(p.primary, -0.28),
        p.secondary,
      ];
      const amp = S * 0.06;
      const waves = cols
        .map((col, i) => {
          const y = H * (0.34 + i * 0.16);
          return `<path d="M0 ${y} C ${W * 0.32} ${y - amp}, ${W * 0.68} ${y + amp}, ${W} ${y} L ${W} ${H} L 0 ${H} Z" fill="${col}"/>`;
        })
        .join("");
      return `<rect width="${W}" height="${H}" fill="${shade(p.primary, 0.14)}"/>${waves}`;
    }
    case "halo": {
      // Eş merkezli halkalar (amblem arkasında ışıma).
      const cx = W / 2;
      const cy = H * 0.4;
      const rings = [];
      for (let i = 9; i >= 1; i--) {
        rings.push(
          `<circle cx="${cx}" cy="${cy}" r="${(S * 0.075 * i).toFixed(0)}" fill="none" stroke="${p.accent}" stroke-width="${Math.max(2, S * 0.0035).toFixed(1)}" opacity="${(0.05 + i * 0.012).toFixed(3)}"/>`,
        );
      }
      return `<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${shade(p.primary, -0.08)}"/>
          <stop offset="1" stop-color="${shade(p.primary, -0.62)}"/>
        </linearGradient>
        <rect width="${W}" height="${H}" fill="url(#hg)"/>${rings.join("")}`;
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

// Oyuncu fotoğraflı tasarım — yerel webp data:URI olarak gömülür (canvas tainted
// olmaz). name = oyuncu adı, jersey = forma no.
function playerWallpaper(
  W: number,
  H: number,
  S: number,
  p: Palette,
  name: string,
  abbr: string,
  photo: string,
  jersey?: string,
): string {
  const cx = W / 2;
  const cy = Math.round(H * 0.36);
  const R = Math.round(S * 0.27);
  const ring = Math.max(5, Math.round(S * 0.014));
  const j = jersey ? esc(jersey) : "";
  const barW = Math.round(Math.min(W * 0.9, R * 3.4));
  const barH = Math.round(S * 0.17);
  const barY = cy + R + Math.round(S * 0.06);
  const nameSize = Math.round(S * 0.076);
  const labelSize = Math.round(S * 0.05);
  const footSize = Math.round(S * 0.032);
  const ink = luminance(p.primary) > 0.6 ? "#0b1018" : "#ffffff";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(p.primary, 0.05)}"/>
      <stop offset="0.6" stop-color="${shade(p.primary, -0.35)}"/>
      <stop offset="1" stop-color="${shade(p.primary, -0.65)}"/>
    </linearGradient>
    <clipPath id="pc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#pg)"/>
  ${j ? `<text x="${cx}" y="${(H * 0.66).toFixed(0)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${Math.round(S * 0.72)}" fill="${ink}" opacity="0.08">${j}</text>` : ""}
  <circle cx="${cx}" cy="${cy}" r="${R + ring}" fill="${p.accent}"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(8,12,20,0.55)"/>
  <image href="${photo}" x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/>
  <g font-family="Arial, Helvetica, sans-serif">
    <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="${Math.round(barH * 0.16)}" fill="rgba(8,12,20,0.55)"/>
    <text x="${cx}" y="${(barY + barH * 0.38).toFixed(0)}" text-anchor="middle" font-weight="800" font-size="${labelSize}" fill="${p.accent}" letter-spacing="${Math.round(labelSize * 0.06)}">${j ? `#${j} · ${abbr}` : abbr}</text>
    <text x="${cx}" y="${(barY + barH * 0.72).toFixed(0)}" text-anchor="middle" font-weight="800" font-size="${nameSize}" fill="#ffffff">${name}</text>
    <text x="${cx}" y="${(H - S * 0.05).toFixed(0)}" text-anchor="middle" font-weight="600" font-size="${footSize}" fill="#ffffff" opacity="0.7">FIFA Dünya Kupası 2026</text>
  </g>
</svg>`;
}

export function buildWallpaperSVG(o: WallpaperOpts): string {
  const W = o.width ?? 1080;
  const H = o.height ?? 2340;
  const S = Math.min(W, H);
  const p = o.palette;
  const name = esc(o.name || "Takım");
  const abbr = esc((o.abbr || "WC").toUpperCase().slice(0, 3));

  if (o.style === "oyuncu" && o.photo) {
    return playerWallpaper(W, H, S, p, name, abbr, o.photo, o.jersey);
  }
  // Fotoğraf yoksa oyuncu stili gradyana düşer.
  const style: WallpaperStyle = o.style === "oyuncu" ? "gradyan" : o.style;

  const cx = W / 2;
  const crestCy = Math.round(H * 0.4);
  const R = Math.round(S * 0.22);
  const abbrSize = Math.round(R * (abbr.length <= 2 ? 0.92 : 0.78));
  const barW = Math.round(Math.min(W * 0.86, R * 3.7));
  const barH = Math.round(S * 0.13);
  const barY = crestCy + R + Math.round(S * 0.05);
  const nameSize = Math.round(S * 0.085);
  const subSize = Math.round(S * 0.04);
  const footSize = Math.round(S * 0.033);
  const ring = Math.max(4, Math.round(S * 0.011));

  // Metin her zaman koyu yarı saydam bant + beyaz yazı → her renkte okunur.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${background(style, W, H, p)}
  <g font-family="Arial, Helvetica, sans-serif">
    <circle cx="${cx}" cy="${crestCy}" r="${R}" fill="rgba(8,12,20,0.42)" stroke="${p.accent}" stroke-width="${ring}"/>
    <text x="${cx}" y="${(crestCy + abbrSize * 0.34).toFixed(0)}" text-anchor="middle" font-weight="800" font-size="${abbrSize}" fill="#ffffff" letter-spacing="${Math.round(R * 0.02)}">${abbr}</text>
    <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="${Math.round(barH * 0.16)}" fill="rgba(8,12,20,0.5)"/>
    <text x="${cx}" y="${(barY + barH * 0.45).toFixed(0)}" text-anchor="middle" font-weight="800" font-size="${nameSize}" fill="#ffffff">${name}</text>
    <text x="${cx}" y="${(barY + barH * 0.74).toFixed(0)}" text-anchor="middle" font-weight="700" font-size="${subSize}" fill="${p.accent}" letter-spacing="${Math.round(subSize * 0.18)}">DÜNYA KUPASI 2026</text>
    <text x="${cx}" y="${(H - S * 0.05).toFixed(0)}" text-anchor="middle" font-weight="600" font-size="${footSize}" fill="#ffffff" opacity="0.7">FIFA Dünya Kupası · 11 Haz – 19 Tem · Kuzey Amerika</text>
  </g>
</svg>`;
}
