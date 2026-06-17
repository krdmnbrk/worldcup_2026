import Link from "next/link";
import type { Metadata } from "next";
import { getTeams } from "@/lib/data";
import { Container, Card, StaleBanner, EmptyState } from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";
import type { Team } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Takımlar" };

export default async function TeamsPage() {
  const { data, stale } = await getTeams();

  const byGroup = new Map<string, Team[]>();
  for (const t of data) {
    const g = t.groupId || "?";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(t);
  }
  const groups = Array.from(byGroup.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Takımlar
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          Turnuvadaki 48 takım — gruplara göre.
        </p>

        {data.length ? (
          <div className="space-y-8">
            {groups.map(([g, teams]) => (
              <section key={g}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-300">
                  {g === "?" ? "Diğer" : `Grup ${g}`}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {teams.map((t) => (
                    <Link key={t.id} href={`/takimlar/${t.id}`}>
                      <Card className="flex items-center gap-3 p-3 transition-colors hover:border-amber-500/40 hover:bg-white/[0.06]">
                        <TeamFlag
                          abbr={t.abbr}
                          logo={t.logo}
                          name={t.name}
                          size={32}
                        />
                        <span className="truncate text-sm font-semibold text-white">
                          {trCountry(t.name)}
                        </span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="Takım verisi alınamadı." />
        )}
      </Container>
    </>
  );
}
