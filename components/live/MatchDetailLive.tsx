"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEspnPoll } from "@/components/useEspnPoll";
import {
  browserMatch,
  browserSummary,
  browserFormation,
  browserPreview,
} from "@/lib/espn/browser";
import type { NormalizedSummary } from "@/lib/espn/normalize";
import {
  Container,
  Card,
  Pill,
  LiveBadge,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { KeyMomentsTimeline } from "@/components/KeyMomentsTimeline";
import { LineupPitch } from "@/components/LineupPitch";
import { MatchSummaryStats } from "@/components/MatchSummaryStats";
import { MatchPreview } from "@/components/MatchPreview";
import { AddToCalendar } from "@/components/AddToCalendar";
import { venueInfo } from "@/data/venues";
import { trCountry } from "@/lib/i18n";
import { formatDateTime } from "@/lib/datetime";
import { coachFor } from "@/data/coaches";
import type {
  Match,
  TeamLineup,
  MatchPreview as MatchPreviewData,
} from "@/lib/domain/types";

function TeamBlock({
  name,
  abbr,
  logo,
  id,
}: {
  name: string;
  abbr: string;
  logo?: string;
  id: string;
}) {
  return (
    <Link
      href={`/takimlar/${id}`}
      className="flex flex-1 flex-col items-center gap-2 text-center"
    >
      <TeamFlag abbr={abbr} logo={logo} name={name} size={64} />
      <span className="text-sm font-bold text-white sm:text-base">
        {trCountry(name)}
      </span>
    </Link>
  );
}

export function MatchDetailLive({ initialMatch }: { initialMatch: Match }) {
  const id = initialMatch.id;
  const { data: match } = useEspnPoll<Match>(
    async () => (await browserMatch(id, initialMatch.date)) ?? initialMatch,
    30000,
    initialMatch,
    initialMatch.status !== "post",
  );

  const [summary, setSummary] = useState<NormalizedSummary | null>(null);
  const [formations, setFormations] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState<MatchPreviewData | null>(null);
  const [tab, setTab] = useState("anlar");

  const played = match.status === "in" || match.status === "post";

  // Pre-maç: önizleme (H2H + form + oran) çek
  useEffect(() => {
    if (played) return;
    let cancelled = false;
    browserPreview(id).then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [id, played]);

  useEffect(() => {
    if (!played) return;
    let cancelled = false;
    (async () => {
      const s = await browserSummary(id);
      if (cancelled) return;
      setSummary(s);
      setLoaded(true);
      if (s) {
        const fos: Record<string, string> = {};
        await Promise.all(
          s.lineups.map(async (lu) => {
            const f = await browserFormation(id, lu.teamId);
            if (f) fos[lu.teamId] = f;
          }),
        );
        if (!cancelled) setFormations(fos);
      }
    })();
    return () => {
      cancelled = true;
    };
    // status değişince (başlama/bitiş) yeniden çek
  }, [id, played, match.status]);

  const orderedLineups: TeamLineup[] = summary
    ? ([
        summary.lineups.find((l) => l.teamId === match.home.id),
        summary.lineups.find((l) => l.teamId === match.away.id),
      ].filter(Boolean) as TeamLineup[]).map((l) => ({
        ...l,
        formation: formations[l.teamId] ?? l.formation,
        coach: coachFor(l.teamId),
      }))
    : [];
  const home = orderedLineups[0];
  const away = orderedLineups[1];
  const venue = venueInfo(match.venue.name, match.venue.city);
  // Mobilde sekme; masaüstünde (lg) hepsi görünür
  const sec = (k: string) => `${tab === k ? "block" : "hidden"} lg:block`;
  const tabs = [
    { key: "anlar", label: "Kritik Anlar" },
    { key: "istatistik", label: "İstatistik" },
    { key: "dizilis", label: "Diziliş" },
    ...(summary?.recap ? [{ key: "anlati", label: "Anlatı" }] : []),
  ];

  return (
    <>
      <section className="border-b border-white/10 bg-gradient-to-b from-slate-900/60 to-transparent">
        <Container className="py-6">
          <Link href="/fikstur" className="text-xs text-slate-400 hover:text-white">
            ← Fikstüre dön
          </Link>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>{match.roundLabel}</span>
            {match.group && match.stage !== "group" && (
              <Pill tone="slate">Grup {match.group}</Pill>
            )}
            {match.status === "in" ? (
              <LiveBadge />
            ) : match.status === "post" ? (
              <Pill tone="slate">{match.statusDetail || "Bitti"}</Pill>
            ) : (
              <Pill tone="emerald">Yaklaşan</Pill>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 sm:gap-8">
            <TeamBlock
              name={match.home.name}
              abbr={match.home.abbr}
              logo={match.home.logo}
              id={match.home.id}
            />
            <div className="shrink-0 text-center">
              {played ? (
                <div className="font-mono text-4xl font-extrabold text-white tabular-nums sm:text-5xl">
                  {match.home.score ?? 0}
                  <span className="px-2 text-slate-600">-</span>
                  {match.away.score ?? 0}
                </div>
              ) : (
                <div className="text-2xl font-bold text-emerald-300">VS</div>
              )}
              {match.home.shootoutScore != null &&
                match.away.shootoutScore != null && (
                  <div className="mt-1 text-sm font-semibold text-amber-300">
                    Penaltılar: {match.home.shootoutScore}-
                    {match.away.shootoutScore}
                  </div>
                )}
              {match.status === "in" && match.clock && (
                <div className="mt-1 text-xs font-semibold text-red-300">
                  {match.clock}
                </div>
              )}
              {!played && (
                <div className="mt-1 text-xs text-slate-400">
                  {formatDateTime(match.date)}
                </div>
              )}
            </div>
            <TeamBlock
              name={match.away.name}
              abbr={match.away.abbr}
              logo={match.away.logo}
              id={match.away.id}
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-center text-xs text-slate-500">
            {match.venue.name && (
              <span>
                🏟 {match.venue.name}
                {match.venue.city ? `, ${match.venue.city}` : ""}
                {venue?.capacity
                  ? ` · ${venue.capacity.toLocaleString("tr-TR")} kapasite`
                  : ""}
                {venue?.altitude ? ` · ${venue.altitude}m rakım` : ""}
                {venue?.roof ? ` · ${venue.roof}` : ""}
              </span>
            )}
            {played && <span>🗓 {formatDateTime(match.date)}</span>}
            {summary?.referee && <span>👤 Hakem: {summary.referee}</span>}
            {summary?.attendance ? (
              <span>👥 {summary.attendance.toLocaleString("tr-TR")} seyirci</span>
            ) : null}
            {match.broadcasts && match.broadcasts.length > 0 && (
              <span>📺 {match.broadcasts.join(", ")}</span>
            )}
          </div>

          <div className="mt-3 flex justify-center">
            <AddToCalendar matches={[match]} filename={`mac-${match.id}`} />
          </div>
        </Container>
      </section>

      <Container className="py-8">
        {!played ? (
          preview ? (
            <MatchPreview preview={preview} home={match.home} away={match.away} />
          ) : (
            <EmptyState
              title="Maç henüz oynanmadı."
              hint="Maç öncesi bilgiler (form, H2H, oran) yükleniyor…"
            />
          )
        ) : (
          <div>
            {/* Mobil sekme şeridi (masaüstünde tüm bölümler görünür) */}
            <div className="x-scroll mb-4 flex gap-2 overflow-x-auto lg:hidden">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`min-h-[2.5rem] whitespace-nowrap rounded-full px-4 text-sm font-medium ${
                    tab === t.key
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              <div className="space-y-8 lg:col-span-3">
                {summary?.recap && (
                  <section className={sec("anlati")}>
                    <h2 className="mb-3 text-lg font-bold text-white">
                      Maç Anlatısı
                    </h2>
                    <Card className="p-4">
                      <p className="mb-2 text-sm font-semibold text-white">
                        {summary.recap.headline}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">
                        {summary.recap.text.slice(0, 900)}
                        {summary.recap.text.length > 900 ? "…" : ""}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Kaynak: ESPN (İngilizce)
                      </p>
                    </Card>
                  </section>
                )}

                <section className={sec("anlar")}>
                  <h2 className="mb-3 text-lg font-bold text-white">Kritik Anlar</h2>
                  <Card className="p-4">
                    <KeyMomentsTimeline
                      events={match.events}
                      homeId={match.home.id}
                    />
                  </Card>
                </section>

                <section className={sec("istatistik")}>
                  <h2 className="mb-3 text-lg font-bold text-white">
                    Maç İstatistikleri
                  </h2>
                  <Card className="p-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-300">
                        {trCountry(match.home.name)}
                      </span>
                      <span className="text-sky-300">
                        {trCountry(match.away.name)}
                      </span>
                    </div>
                    {summary ? (
                      <MatchSummaryStats stats={summary.teamStats} />
                    ) : loaded ? (
                      <p className="py-6 text-center text-sm text-slate-500">
                        İstatistik verisi yok.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-6" />
                        ))}
                      </div>
                    )}
                  </Card>
                </section>
              </div>

              <div className="space-y-8 lg:col-span-2">
                <section className={sec("dizilis")}>
                  <h2 className="mb-3 text-lg font-bold text-white">Dizilişler</h2>
                  {summary ? (
                    <div className="space-y-4">
                      {home && (
                        <Card className="p-3">
                          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                            <TeamFlag
                              abbr={match.home.abbr}
                              logo={match.home.logo}
                              name={match.home.name}
                              size={20}
                            />
                            {trCountry(match.home.name)}
                          </p>
                          <LineupPitch lineup={home} />
                        </Card>
                      )}
                      {away && (
                        <Card className="p-3">
                          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                            <TeamFlag
                              abbr={match.away.abbr}
                              logo={match.away.logo}
                              name={match.away.name}
                              size={20}
                            />
                            {trCountry(match.away.name)}
                          </p>
                          <LineupPitch lineup={away} />
                        </Card>
                      )}
                    </div>
                  ) : loaded ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Kadro verisi yok.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
