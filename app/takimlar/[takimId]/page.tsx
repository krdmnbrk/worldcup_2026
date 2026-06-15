import Link from "next/link";
import type { Metadata } from "next";
import { getTeamPage, getTeams } from "@/lib/data";
import {
  Container,
  Card,
  SectionTitle,
  Pill,
  StaleBanner,
  EmptyState,
} from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { FormBadge } from "@/components/FormBadge";
import { GroupTable } from "@/components/GroupTable";
import { MatchList } from "@/components/MatchList";
import { PlayerCard } from "@/components/PlayerCard";
import { trCountry } from "@/lib/i18n";

export async function generateStaticParams() {
  const { data } = await getTeams();
  return data.map((t) => ({ takimId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ takimId: string }>;
}): Promise<Metadata> {
  const { takimId } = await params;
  try {
    const { data } = await getTeamPage(takimId);
    return { title: trCountry(data.team.name) };
  } catch {
    return { title: "Takım" };
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ takimId: string }>;
}) {
  const { takimId } = await params;
  const { data, stale } = await getTeamPage(takimId);
  const { team, standingSummary, groupId, squad, matches, groupStanding, form } =
    data;

  const sortedSquad = [...squad].sort(
    (a, b) => Number(a.jersey ?? 99) - Number(b.jersey ?? 99),
  );

  return (
    <>
      <StaleBanner stale={stale} />
      <section className="border-b border-white/10 bg-gradient-to-b from-slate-900/60 to-transparent">
        <Container className="py-8">
          <Link href="/takimlar" className="text-xs text-slate-400 hover:text-white">
            ← Takımlar
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <TeamFlag abbr={team.abbr} logo={team.logo} name={team.name} size={64} />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {trCountry(team.name)}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                {groupId && <Pill tone="emerald">Grup {groupId}</Pill>}
                {standingSummary && <span>{standingSummary}</span>}
                {form.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">Form:</span>
                    <FormBadge results={form} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-8">
        {groupStanding && (
          <section>
            <SectionTitle title={`Grup ${groupStanding.groupId} Durumu`} />
            <div className="max-w-xl">
              <GroupTable group={groupStanding} />
            </div>
          </section>
        )}

        <section>
          <SectionTitle title="Maçlar" />
          <MatchList
            matches={matches}
            emptyText="Maç bulunamadı."
            showGroup={false}
          />
        </section>

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
