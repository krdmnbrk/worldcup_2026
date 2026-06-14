"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEspnPoll } from "@/components/useEspnPoll";
import {
  browserMatch,
  browserSummary,
  browserFormation,
} from "@/lib/espn/browser";
import type { NormalizedSummary } from "@/lib/espn/normalize";
import {
  Container,
  Card,
  Pill,
  LiveBadge,
  EmptyState,
} from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { KeyMomentsTimeline } from "@/components/KeyMomentsTimeline";
import { LineupPitch } from "@/components/LineupPitch";
import { MatchSummaryStats } from "@/components/MatchSummaryStats";
import { trCountry } from "@/lib/i18n";
import { formatDateTime } from "@/lib/datetime";
import { coachFor } from "@/data/coaches";
import type { Match, TeamLineup } from "@/lib/domain/types";

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

  const played = match.status === "in" || match.status === "post";

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
              </span>
            )}
            {played && <span>🗓 {formatDateTime(match.date)}</span>}
            {summary?.referee && <span>👤 Hakem: {summary.referee}</span>}
            {summary?.attendance ? (
              <span>👥 {summary.attendance.toLocaleString("tr-TR")} seyirci</span>
            ) : null}
          </div>
        </Container>
      </section>

      <Container className="py-8">
        {!played ? (
          <EmptyState
            title="Maç henüz oynanmadı."
            hint="Kadrolar, kritik anlar ve istatistikler maç başladığında burada görünecek."
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-3">
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">Kritik Anlar</h2>
                <Card className="p-4">
                  <KeyMomentsTimeline
                    events={match.events}
                    homeId={match.home.id}
                  />
                </Card>
              </section>

              <section>
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
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-500">
                      {loaded ? "İstatistik verisi yok." : "Yükleniyor…"}
                    </p>
                  )}
                </Card>
              </section>
            </div>

            <div className="space-y-8 lg:col-span-2">
              <section>
                <h2 className="mb-3 text-lg font-bold text-white">Dizilişler</h2>
                {!summary ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    {loaded ? "Kadro verisi yok." : "Kadrolar yükleniyor…"}
                  </p>
                ) : (
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
                )}
              </section>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
