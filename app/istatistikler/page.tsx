import type { Metadata } from "next";
import { getTournamentStats } from "@/lib/data";
import {
  Container,
  Card,
  SectionTitle,
  StaleBanner,
} from "@/components/ui";
import {
  StatLeaderboard,
  scorerEntries,
  teamGoalEntries,
} from "@/components/StatLeaderboard";
import { BarChartCard } from "@/components/StatChart";
import { MatchCard } from "@/components/MatchCard";
import { trCountry } from "@/lib/i18n";

export const metadata: Metadata = { title: "İstatistikler" };

export default async function StatsPage() {
  const { data, stale } = await getTournamentStats();

  const scorerChart = data.topScorers
    .slice(0, 8)
    .map((s) => ({ label: s.name.split(/\s+/).slice(-1)[0], value: s.value }));
  const teamChart = data.teamGoals
    .slice(0, 8)
    .map((t) => ({ label: trCountry(t.teamName), value: t.value }));

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Turnuva İstatistikleri
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          Tüm rakamlar oynanan maçlardan canlı olarak hesaplanır.
        </p>

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric label="Oynanan maç" value={`${data.playedMatches}`} />
          <Metric label="Toplam gol" value={`${data.totalGoals}`} />
          <Metric label="Maç başı gol" value={data.avgGoalsPerMatch.toFixed(2)} />
          <Metric label="Sarı kart" value={`${data.yellowCards}`} />
          <Metric label="Kırmızı kart" value={`${data.redCards}`} />
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <SectionTitle title="Gol Krallığı" subtitle="En çok gol atan oyuncular" />
            <Card className="p-3">
              <StatLeaderboard
                entries={scorerEntries(data.topScorers)}
                kind="player"
                emptyText="Henüz gol kaydı yok."
              />
            </Card>
            {scorerChart.length > 0 && (
              <Card className="mt-3 p-3">
                <BarChartCard data={scorerChart} multicolor />
              </Card>
            )}
          </section>

          <section>
            <SectionTitle title="En Golcü Takımlar" subtitle="Takım gol sayıları" />
            <Card className="p-3">
              <StatLeaderboard
                entries={teamGoalEntries(data.teamGoals)}
                kind="team"
                emptyText="Henüz gol kaydı yok."
              />
            </Card>
            {teamChart.length > 0 && (
              <Card className="mt-3 p-3">
                <BarChartCard data={teamChart} color="#22c55e" />
              </Card>
            )}
          </section>

          <section>
            <SectionTitle
              title="Gol Yemeyen Takımlar"
              subtitle="Kalesini gole kapatma sayısı"
            />
            <Card className="p-3">
              <StatLeaderboard
                entries={teamGoalEntries(data.cleanSheetTeams)}
                kind="team"
                unit=""
                emptyText="Henüz kayıt yok."
              />
            </Card>
          </section>

          <section>
            <SectionTitle title="En Çok Kart Görenler" />
            <Card className="p-3">
              <StatLeaderboard
                entries={data.topCarded.map((c) => ({
                  id: c.id,
                  name: c.name,
                  sub: c.teamName ? trCountry(c.teamName) : c.teamAbbr,
                  value: c.value,
                  headshot: c.headshot,
                  href: /^\d+$/.test(c.id) ? `/oyuncular/${c.id}` : undefined,
                }))}
                kind="player"
                emptyText="Henüz kart kaydı yok."
              />
            </Card>
            {data.biggestWin && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  En farklı galibiyet ({data.biggestWin.margin} fark)
                </p>
                <MatchCard match={data.biggestWin.match} />
              </div>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
    </div>
  );
}
