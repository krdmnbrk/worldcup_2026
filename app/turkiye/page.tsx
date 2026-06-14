import type { Metadata } from "next";
import { getTurkiye } from "@/lib/data";
import {
  Container,
  Card,
  SectionTitle,
  Pill,
  StaleBanner,
  EmptyState,
} from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { GroupTable } from "@/components/GroupTable";
import { MatchList } from "@/components/MatchList";
import { PlayerCard } from "@/components/PlayerCard";
import { StatLeaderboard, scorerEntries } from "@/components/StatLeaderboard";
import { trCountry } from "@/lib/i18n";

export const metadata: Metadata = { title: "Türkiye" };

export default async function TurkiyePage() {
  const { data, stale } = await getTurkiye();

  if (!data) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Türkiye verisi bulunamadı."
          hint="ESPN turnuva listesinde takım eşleşmesi yapılamadı."
        />
      </Container>
    );
  }

  const { team, groupId, standingSummary, matches, groupStanding, squad, topScorers } =
    data;
  const sortedSquad = [...squad].sort(
    (a, b) => Number(a.jersey ?? 99) - Number(b.jersey ?? 99),
  );

  return (
    <>
      <StaleBanner stale={stale} />

      <section className="border-b border-red-500/20 bg-gradient-to-b from-red-950/50 to-transparent">
        <Container className="py-8">
          <div className="flex items-center gap-4">
            <TeamFlag abbr={team.abbr} logo={team.logo} name={team.name} size={64} />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Türkiye
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                {groupId && <Pill tone="red">Grup {groupId}</Pill>}
                {standingSummary && <span>{standingSummary}</span>}
              </div>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Ay-yıldızlıların 2026 Dünya Kupası serüveni: maçlar, kadro,
            golcüler ve grup durumu.
          </p>
        </Container>
      </section>

      <Container className="space-y-10 py-8">
        <section>
          <SectionTitle title="Maçlar" />
          <MatchList matches={matches} emptyText="Maç bulunamadı." showGroup={false} />
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {groupStanding && (
            <section>
              <SectionTitle title={`Grup ${groupStanding.groupId} Durumu`} />
              <GroupTable group={groupStanding} />
            </section>
          )}

          <section>
            <SectionTitle title="Türkiye Golcüleri" />
            <Card className="p-3">
              <StatLeaderboard
                entries={scorerEntries(
                  topScorers.map((s) => ({ ...s, teamName: trCountry(team.name) })),
                )}
                kind="player"
                emptyText="Henüz gol kaydı yok."
              />
            </Card>
          </section>
        </div>

        <section>
          <SectionTitle title="Kadro" subtitle={`${squad.length} oyuncu`} />
          {sortedSquad.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sortedSquad.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Kadro verisi bulunamadı." />
          )}
        </section>
      </Container>
    </>
  );
}
