import { describe, it, expect } from "vitest";
import {
  resolvePalette,
  buildWallpaperSVG,
  shade,
  luminance,
  WALLPAPER_STYLES,
  WALLPAPER_SIZES,
} from "@/lib/wallpaper";

describe("renk yardımcıları", () => {
  it("shade koyulaştırır/açar", () => {
    expect(shade("#ffffff", -1)).toBe("#000000");
    expect(shade("#000000", 1)).toBe("#ffffff");
    expect(shade("#808080", 0)).toBe("#808080");
  });
  it("luminance beyaz>siyah", () => {
    expect(luminance("#ffffff")).toBeGreaterThan(luminance("#000000"));
    expect(luminance("#ffffff")).toBeCloseTo(1, 1);
  });
});

describe("resolvePalette", () => {
  it("küratörlü takım (TUR) sabit primary", () => {
    const p = resolvePalette("TUR");
    expect(p.primary.toLowerCase()).toBe("#e30a17");
    expect(p.accent).toBe("#ffffff");
    expect(p.secondary).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it("küratör yoksa ESPN colorHex'ten türetir", () => {
    const p = resolvePalette("XYZ", "3366cc");
    expect(p.primary).toBe("#3366cc");
    expect(p.secondary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(p.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it("hiç renk yoksa kısaltmadan deterministik üretir", () => {
    const a = resolvePalette("QWE");
    const b = resolvePalette("QWE");
    expect(a).toEqual(b); // deterministik
    expect(a.primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it("geçersiz colorHex'i yok sayar (hash fallback)", () => {
    const p = resolvePalette("ZZZ", "not-a-color");
    expect(p.primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("buildWallpaperSVG", () => {
  const palette = resolvePalette("TUR");
  it("geçerli SVG + boyut + kısaltma + ad", () => {
    const svg = buildWallpaperSVG({
      name: "Türkiye",
      abbr: "TUR",
      palette,
      style: "gradyan",
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="2340"');
    expect(svg).toContain(">TUR<");
    expect(svg).toContain("Türkiye");
    expect(svg).toContain("DÜNYA KUPASI 2026");
  });
  it("tüm stiller geçerli svg üretir", () => {
    for (const s of WALLPAPER_STYLES) {
      const svg = buildWallpaperSVG({
        name: "Test",
        abbr: "TST",
        palette,
        style: s.key,
      });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.includes("</svg>")).toBe(true);
    }
  });
  it("ad içindeki özel karakterleri kaçırır (XML enjeksiyon yok)", () => {
    const svg = buildWallpaperSVG({
      name: 'A<b>&"x',
      abbr: "AB",
      palette,
      style: "gradyan",
    });
    expect(svg).toContain("A&lt;b&gt;&amp;&quot;x");
    expect(svg).not.toContain("<b>");
  });

  it("özel boyut viewBox/width/height'a yansır", () => {
    for (const s of WALLPAPER_SIZES) {
      const svg = buildWallpaperSVG({
        name: "Test",
        abbr: "TST",
        palette,
        style: "gradyan",
        width: s.w,
        height: s.h,
      });
      expect(svg).toContain(`width="${s.w}"`);
      expect(svg).toContain(`height="${s.h}"`);
      expect(svg).toContain(`viewBox="0 0 ${s.w} ${s.h}"`);
    }
  });

  it("oyuncu stili: foto verilince <image> gömülür + forma no", () => {
    const photo = "data:image/webp;base64,AAAA";
    const svg = buildWallpaperSVG({
      name: "Arda Güler",
      abbr: "TUR",
      palette,
      style: "oyuncu",
      photo,
      jersey: "10",
    });
    expect(svg).toContain("<image");
    expect(svg).toContain(photo);
    expect(svg).toContain("Arda Güler");
    expect(svg).toContain("#10");
  });

  it("oyuncu stili: foto yoksa gradyana düşer (geçerli svg, image yok)", () => {
    const svg = buildWallpaperSVG({
      name: "X",
      abbr: "TUR",
      palette,
      style: "oyuncu",
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).not.toContain("<image");
  });
});
