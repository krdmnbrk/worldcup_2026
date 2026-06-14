import Link from "next/link";
import { getAllMatches, getTournamentStats } from "@/lib/data";
import {
  Container,
  Card,
  SectionTitle,
  Pill,
  StaleBanner,
  EmptyState,
} from "@/components/ui";
import { MatchCard } from "@/components/MatchCard";
import { StatLeaderboard, scorerEntries } from "@/components/StatLeaderboard";
import { LiveTodayMatches } from "@/components/live/LiveTodayMatches";
import { SITE } from "@/lib/i18n";
import type { Match } from "@/lib/domain/types";

const byDateAsc = (a: Match, b: Match) => +new Date(a.date) - +new Date(b.date);
const byDateDesc = (a: Match, b: Match) => +new Date(b.date) - +new Date(a.date);

export default async function HomePage() {
  const [matchesRes, statsRes] = await Promise.all([
    getAllMatches(),
    getTournamentStats(),
  ]);
  const all = matchesRes.data;
  const live = all.filter((m) => m.status === "in");
  const recent = all
    .filter((m) => m.status === "post")
    .sort(byDateDesc)
    .slice(0, 6);
  const upcoming = all
    .filter((m) => m.status === "pre")
    .sort(byDateAsc)
    .slice(0, 6);
  const playedCount = all.filter((m) => m.status === "post").length;

  const turk = all
    .filter((m) => m.home.abbr === "TUR" || m.away.abbr === "TUR")
    .sort(byDateAsc);
  const turkLast = [...turk].reverse().find((m) => m.status === "post");
  const turkNext = turk.find((m) => m.status === "pre");

  return (
    <>
      <StaleBanner stale={matchesRes.stale} />

      <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/40 to-transparent">
        <Container className="py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald">Grup Aşaması</Pill>
            <Pill tone="slate">{SITE.hosts}</Pill>
            {live.length > 0 && <Pill tone="red">{live.length} maç canlı</Pill>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {SITE.longTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            {SITE.subtitle}. 48 takım, 12 grup, 104 maç. Canlı skorlar, fikstür,
            grup tabloları, eleme ağacı ve istatistikleri tek yerde takip edin.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Stat label="Oynanan maç" value={`${playedCount} / 104`} />
            <Stat label="Toplam gol" value={String(statsRes.data.totalGoals)} />
            <Stat
              label="Maç başı gol"
              value={statsRes.data.avgGoalsPerMatch.toFixed(2)}
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-12 py-10">
        <section>
          <SectionTitle
            title={live.length ? "Canlı ve Bugün" : "Bugünün Maçları"}
            subtitle="Maç günü skor takibi"
            href="/fikstur"
          />
          <LiveTodayMatches initial={all} />
        </section>

        <div className="grid gap-12 lg:grid-cols-2">
          <section>
            <SectionTitle title="Son Sonuçlar" href="/fikstur" />
            <div className="grid gap-2">
              {recent.length ? (
                recent.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <EmptyState title="Henüz oynanmış maç yok." />
              )}
            </div>
          </section>
          <section>
            <SectionTitle title="Yaklaşan Maçlar" href="/fikstur" />
            <div className="grid gap-2">
              {upcoming.length ? (
                upcoming.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <EmptyState title="Yaklaşan maç bulunamadı." />
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <section>
            <SectionTitle title="Gol Krallığı" href="/istatistikler" />
            <Card className="p-3">
              <StatLeaderboard
                entries={scorerEntries(statsRes.data.topScorers.slice(0, 6))}
                kind="player"
                emptyText="Henüz gol kaydı yok."
              />
            </Card>
          </section>

          <section>
            <SectionTitle title="Türkiye" href="/turkiye" hrefLabel="Takip et" />
            <Card className="space-y-3 p-4">
              <p className="text-sm text-slate-400">
                Ay-yıldızlıların Dünya Kupası yolculuğunu yakından takip edin.
              </p>
              {turkLast && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Son maç
                  </p>
                  <MatchCard match={turkLast} />
                </div>
              )}
              {turkNext && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sonraki maç
                  </p>
                  <MatchCard match={turkNext} />
                </div>
              )}
              {!turkLast && !turkNext && (
                <Link
                  href="/turkiye"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Türkiye sayfasına git →
                </Link>
              )}
            </Card>
          </section>
        </div>
      </Container>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
