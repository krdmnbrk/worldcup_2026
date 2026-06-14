import type { Metadata } from "next";
import { getStandings } from "@/lib/data";
import { Container, StaleBanner } from "@/components/ui";
import { LiveGroups } from "@/components/live/LiveGroups";

export const metadata: Metadata = { title: "Grup Tabloları" };

export default async function GroupsPage() {
  const { data, stale } = await getStandings();

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Grup Tabloları
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          12 grup · her gruptan ilk 2 doğrudan son 32 turuna, en iyi 8 üçüncü de
          eleme turuna kalır.
        </p>

        <div className="mb-6 mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded bg-emerald-500" /> İlk 2 — tur atlar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-1 rounded bg-amber-500" /> 3. — en iyi 8 içinde
            olabilir
          </span>
        </div>

        <LiveGroups initial={data} />
      </Container>
    </>
  );
}
