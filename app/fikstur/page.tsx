import type { Metadata } from "next";
import { getAllMatches } from "@/lib/data";
import { Container, StaleBanner } from "@/components/ui";
import { FixtureBoard } from "@/components/FixtureBoard";

export const metadata: Metadata = { title: "Fikstür" };

export default async function FixturePage() {
  const { data, stale } = await getAllMatches();

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Fikstür &amp; Sonuçlar
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          11 Haziran – 19 Temmuz 2026 · tüm maçlar (saatler Türkiye saatiyle)
        </p>
        <FixtureBoard matches={data} />
      </Container>
    </>
  );
}
