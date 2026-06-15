"use client";

import { useState, useSyncExternalStore } from "react";
import { useFavoriteTeam } from "@/components/useFavoriteTeam";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";
import {
  buildWallpaperSVG,
  resolvePalette,
  WALLPAPER_STYLES,
  type WallpaperStyle,
} from "@/lib/wallpaper";
import type { Team } from "@/lib/domain/types";

const W = 1080;
const H = 2340;

// URL ?team= değerini lint-güvenli oku (effect'te setState yok, hidrasyon uyumlu).
function useUrlParam(name: string): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export function WallpaperStudio({ teams }: { teams: Team[] }) {
  const { fav } = useFavoriteTeam();
  const urlTeam = useUrlParam("team");
  const [picked, setPicked] = useState<string | null>(null);
  const [style, setStyle] = useState<WallpaperStyle>("gradyan");

  const byId = new Map(teams.map((t) => [t.id, t]));
  const sorted = [...teams].sort((a, b) =>
    trCountry(a.name).localeCompare(trCountry(b.name), "tr"),
  );

  const effectiveId =
    (picked && byId.has(picked) && picked) ||
    (urlTeam && byId.has(urlTeam) && urlTeam) ||
    (fav && byId.has(fav) && fav) ||
    sorted[0]?.id ||
    "";
  const team = byId.get(effectiveId);
  if (!team) return null;

  const trName = trCountry(team.name);
  const palette = resolvePalette(team.abbr, team.colorHex);
  const svg = buildWallpaperSVG({
    name: trName,
    abbr: team.abbr,
    palette,
    style,
  });
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const fileBase = `${(team.abbr || "takim").toLowerCase()}-duvar-kagidi`;

  const downloadPng = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, W, H);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(URL.createObjectURL(blob), `${fileBase}.png`);
      }, "image/png");
    };
    img.src = dataUrl;
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), `${fileBase}.svg`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Kontroller */}
      <div className="order-2 space-y-5 lg:order-1">
        <div>
          <label
            htmlFor="wp-team"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Takım
          </label>
          <div className="flex items-center gap-2">
            <TeamFlag
              abbr={team.abbr}
              logo={team.logo}
              name={team.name}
              size={28}
              className="shrink-0"
            />
            <select
              id="wp-team"
              value={effectiveId}
              onChange={(e) => setPicked(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/40"
            >
              {sorted.map((t) => (
                <option key={t.id} value={t.id}>
                  {trCountry(t.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Tasarım
          </span>
          <div className="flex flex-wrap gap-2">
            {WALLPAPER_STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                aria-pressed={style === s.key}
                className={`min-h-[2.75rem] rounded-xl border px-4 text-sm font-medium transition-colors ${
                  style === s.key
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-emerald-500/20 px-5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/40 transition-colors hover:bg-emerald-500/30"
          >
            ⬇ PNG indir
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-slate-200 transition-colors hover:text-white"
          >
            SVG indir
          </button>
          <FavoriteToggle teamId={team.id} />
        </div>

        <p className="max-w-md text-xs leading-relaxed text-slate-500">
          1080×2340 telefon boyutunda üretilir. iPhone&apos;da görsele basılı
          tutup <span className="text-slate-300">Fotoğraflara Ekle</span>,
          ardından Ayarlar &gt; Duvar Kağıdı&apos;ndan seçebilirsin.
        </p>
      </div>

      {/* Önizleme — telefon çerçevesi */}
      <div className="order-1 mx-auto w-full max-w-[280px] lg:order-2">
        <div className="rounded-[2.2rem] border-[6px] border-slate-800 bg-black p-1.5 shadow-2xl shadow-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`${trName} telefon duvar kağıdı önizlemesi`}
            width={W}
            height={H}
            className="w-full rounded-[1.7rem]"
          />
        </div>
      </div>
    </div>
  );
}
