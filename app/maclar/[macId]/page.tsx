import type { Metadata } from "next";
import { getAllMatches } from "@/lib/data";
import { Container, StaleBanner, EmptyState } from "@/components/ui";
import { MatchDetailLive } from "@/components/live/MatchDetailLive";
import { trCountry } from "@/lib/i18n";

export async function generateStaticParams() {
  const { data } = await getAllMatches();
  return data.map((m) => ({ macId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ macId: string }>;
}): Promise<Metadata> {
  const { macId } = await params;
  const { data } = await getAllMatches();
  const m = data.find((x) => x.id === macId);
  return {
    title: m
      ? `${trCountry(m.home.name)} - ${trCountry(m.away.name)}`
      : "Maç",
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ macId: string }>;
}) {
  const { macId } = await params;
  const { data, stale } = await getAllMatches();
  const match = data.find((m) => m.id === macId);

  if (!match) {
    return (
      <Container className="py-12">
        <EmptyState title="Maç bulunamadı." />
      </Container>
    );
  }

  return (
    <>
      <StaleBanner stale={stale} />
      <MatchDetailLive initialMatch={match} />
    </>
  );
}
