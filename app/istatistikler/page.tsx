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
import { TeamFlag } from "@/components/TeamFlag";
import Link from "next/link";
import { trCountry } from "@/lib/i18n";

export const metadata: Metadata = { title: "İstatistikler" };

export default async function StatsPage() {
  const { data, stale } = await getTournamentStats();
  // eski snapshot'a karşı savunmacı varsayılanlar
  const assistLeaders = data.assistLeaders ?? [];
  const fairPlay = data.fairPlay ?? [];
  const goalIntervals = data.goalIntervals ?? [];

  const scorerChart = data.topScorers
    .slice(0, 8)
    .map((s) => ({ label: s.name.split(/\s+/).slice(-1)[0], value: s.value }));
  const teamChart = data.teamGoals
    .slice(0, 8)
    .map((t) => ({ label: trCountry(t.teamName), value: t.value }));
  const assistChart = assistLeaders
    .slice(0, 8)
    .map((s) => ({ label: s.name.split(/\s+/).slice(-1)[0], value: s.value }));

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

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
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
            <SectionTitle
              title="Asist Krallığı"
              subtitle="En çok asist yapan oyuncular"
            />
            <Card className="p-3">
              <StatLeaderboard
                entries={scorerEntries(assistLeaders)}
                kind="player"
                emptyText="Henüz asist kaydı yok."
              />
            </Card>
            {assistChart.length > 0 && (
              <Card className="mt-3 p-3">
                <BarChartCard data={assistChart} color="#38bdf8" />
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

        {goalIntervals.some((g) => g.value > 0) && (
          <section className="mt-10">
            <SectionTitle
              title="Gol Dakika Dağılımı"
              subtitle="Goller hangi dakikalarda atıldı"
            />
            <Card className="p-3">
              <BarChartCard data={goalIntervals} color="#f59e0b" />
            </Card>
          </section>
        )}

        {fairPlay.length > 0 && (
          <section className="mt-10">
            <SectionTitle
              title="Disiplin / Fair-Play"
              subtitle="Takım başına kart · ceza puanı = sarı×1 + kırmızı×3"
            />
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left font-medium">Takım</th>
                    <th className="w-14 py-2 text-center font-medium">🟨</th>
                    <th className="w-14 py-2 text-center font-medium">🟥</th>
                    <th className="w-16 py-2 text-center font-bold text-slate-300">
                      Puan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fairPlay.map((f) => (
                    <tr
                      key={f.teamId}
                      className="border-t border-white/5 hover:bg-white/[0.04]"
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/takimlar/${f.teamId}`}
                          className="flex items-center gap-2"
                        >
                          <TeamFlag
                            abbr={f.teamAbbr}
                            logo={f.logo}
                            name={f.teamName}
                            size={22}
                          />
                          <span className="truncate font-medium text-white">
                            {trCountry(f.teamName)}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2 text-center text-amber-300">
                        {f.yellow}
                      </td>
                      <td className="py-2 text-center text-red-300">{f.red}</td>
                      <td className="py-2 text-center font-bold text-white">
                        {f.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        )}
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
