import type { Metadata } from "next";
import { getTeams } from "@/lib/data";
import { Container, StaleBanner, EmptyState } from "@/components/ui";
import { WallpaperStudio } from "@/components/WallpaperStudio";

export const metadata: Metadata = {
  title: "Duvar Kağıdı",
  description:
    "Tuttuğun takımın renkleriyle havalı bir telefon duvar kağıdı oluştur ve indir.",
};

export default async function WallpaperPage() {
  const { data, stale } = await getTeams();

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          📱 Takım Duvar Kağıdı
        </h1>
        <p className="mt-1 mb-6 max-w-2xl text-sm text-slate-400">
          Tuttuğun takımı seç, bir tasarım beğen ve telefonun için havalı bir
          duvar kağıdını indir. Tamamen takım renkleriyle üretilir.
        </p>

        {data.length ? (
          <WallpaperStudio teams={data} />
        ) : (
          <EmptyState title="Takım verisi alınamadı." />
        )}
      </Container>
    </>
  );
}
