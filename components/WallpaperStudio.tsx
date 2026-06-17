"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useFavoriteTeam } from "@/components/useFavoriteTeam";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";
import { browserRoster } from "@/lib/espn/browser";
import { PLAYER_PHOTOS } from "@/data/player-photos";
import {
  buildWallpaperSVG,
  resolvePalette,
  WALLPAPER_STYLES,
  WALLPAPER_SIZES,
  type WallpaperStyle,
} from "@/lib/wallpaper";
import type { Team, Player } from "@/lib/domain/types";

const PHOTO_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

// Yerel webp'i base64 data:URI'ye çevir (aynı origin → CORS yok, canvas tainted olmaz).
async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function WallpaperStudio({ teams }: { teams: Team[] }) {
  const { fav } = useFavoriteTeam();
  const urlTeam = useUrlParam("team");
  const [picked, setPicked] = useState<string | null>(null);
  const [style, setStyle] = useState<WallpaperStyle>("gradyan");
  const [sizeKey, setSizeKey] = useState<string>("telefon");

  // Oyuncu stili için kadro + foto durumu
  const [roster, setRoster] = useState<{ teamId: string; players: Player[] } | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ playerId: string; uri: string } | null>(null);

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

  const size = WALLPAPER_SIZES.find((s) => s.key === sizeKey) ?? WALLPAPER_SIZES[0];
  const W = size.w;
  const H = size.h;
  const landscape = W > H;

  const isPlayer = style === "oyuncu";
  // players yalnızca SEÇİLİ takımın kadrosu eşleşince dolu (yükleme sırasında boş).
  const players =
    roster && team && roster.teamId === team.id ? roster.players : [];
  const loadingRoster =
    isPlayer && !!team && (!roster || roster.teamId !== team.id);
  const effPlayer =
    (playerId && players.find((p) => p.id === playerId)) || players[0] || null;

  // Kadroyu (yalnızca oyuncu stilinde) istemcide çek; setState yalnızca await sonrası
  // (lint-güvenli — effect gövdesinde senkron setState yok).
  useEffect(() => {
    if (!isPlayer || !team) return;
    if (roster?.teamId === team.id) return;
    let cancelled = false;
    browserRoster(team.id, team).then((list) => {
      if (cancelled) return;
      const withPhotos = (list ?? []).filter((p) => p.id && PLAYER_PHOTOS[p.id]);
      setRoster({ teamId: team.id, players: withPhotos });
    });
    return () => {
      cancelled = true;
    };
  }, [isPlayer, team, roster?.teamId]);

  // Seçili oyuncunun fotoğrafını data:URI olarak yükle.
  useEffect(() => {
    if (!isPlayer || !effPlayer) return;
    if (photo?.playerId === effPlayer.id) return;
    let cancelled = false;
    const file = PLAYER_PHOTOS[effPlayer.id];
    toDataUri(`${PHOTO_BASE}/players/${file}`).then((uri) => {
      if (!cancelled && uri) setPhoto({ playerId: effPlayer.id, uri });
    });
    return () => {
      cancelled = true;
    };
  }, [isPlayer, effPlayer, photo?.playerId]);

  if (!team) return null;

  const trName = trCountry(team.name);
  const palette = resolvePalette(team.abbr, team.colorHex);
  const photoReady = isPlayer && effPlayer && photo?.playerId === effPlayer.id;
  const svg = buildWallpaperSVG({
    name: isPlayer && effPlayer ? effPlayer.name : trName,
    abbr: team.abbr,
    palette,
    style,
    width: W,
    height: H,
    photo: photoReady ? photo!.uri : undefined,
    jersey: isPlayer && effPlayer ? effPlayer.jersey : undefined,
  });
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const fileBase = `${(team.abbr || "takim").toLowerCase()}-${size.key}-duvar`;

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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Kontroller */}
      <div className="order-2 flex-1 space-y-5 lg:order-1">
        <div>
          <label htmlFor="wp-team" className="mb-1.5 block text-xs font-medium text-slate-400">
            Takım
          </label>
          <div className="flex items-center gap-2">
            <TeamFlag abbr={team.abbr} logo={team.logo} name={team.name} size={28} className="shrink-0" />
            <select
              id="wp-team"
              value={effectiveId}
              onChange={(e) => setPicked(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500/40"
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
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Tasarım</span>
          <div className="flex flex-wrap gap-2">
            {WALLPAPER_STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                aria-pressed={style === s.key}
                className={`min-h-[2.75rem] rounded-xl border px-4 text-sm font-medium transition-colors ${
                  style === s.key
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-300"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isPlayer && (
          <div>
            <label htmlFor="wp-player" className="mb-1.5 block text-xs font-medium text-slate-400">
              Oyuncu
            </label>
            {loadingRoster ? (
              <p className="text-sm text-slate-500">Kadro yükleniyor…</p>
            ) : players.length ? (
              <select
                id="wp-player"
                value={effPlayer?.id ?? ""}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500/40"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jersey ? `#${p.jersey} ` : ""}
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-amber-300">
                Bu takım için fotoğraflı oyuncu bulunamadı — başka takım ya da tasarım seç.
              </p>
            )}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Boyut</span>
          <div className="flex flex-wrap gap-2">
            {WALLPAPER_SIZES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSizeKey(s.key)}
                aria-pressed={sizeKey === s.key}
                className={`min-h-[2.75rem] rounded-xl border px-4 text-sm font-medium transition-colors ${
                  sizeKey === s.key
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-300"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"
                }`}
              >
                {s.label}
                <span className="ml-1 text-[10px] text-slate-500">
                  {s.w}×{s.h}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-amber-500/20 px-5 text-sm font-semibold text-amber-200 ring-1 ring-amber-500/40 transition-colors hover:bg-amber-500/30"
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
          {size.label} boyutunda ({size.w}×{size.h}) üretilir. iPhone&apos;da
          görsele basılı tutup <span className="text-slate-300">Fotoğraflara Ekle</span>,
          ardından Ayarlar &gt; Duvar Kağıdı&apos;ndan seçebilirsin.
        </p>
      </div>

      {/* Önizleme */}
      <div className={`order-1 mx-auto w-full lg:order-2 ${landscape ? "max-w-[520px]" : "max-w-[280px]"}`}>
        <div
          className={
            landscape
              ? "rounded-2xl border border-slate-700 bg-black p-1.5 shadow-2xl shadow-black/40"
              : "rounded-[2.2rem] border-[6px] border-slate-800 bg-black p-1.5 shadow-2xl shadow-black/40"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`${isPlayer && effPlayer ? effPlayer.name : trName} duvar kağıdı önizlemesi`}
            width={W}
            height={H}
            className={`w-full ${landscape ? "rounded-xl" : "rounded-[1.7rem]"}`}
          />
        </div>
      </div>
    </div>
  );
}
