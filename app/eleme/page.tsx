import type { Metadata } from "next";
import { getBracket } from "@/lib/data";
import { Container, Card, Pill, StaleBanner } from "@/components/ui";
import { Bracket } from "@/components/Bracket";
import { TeamFlag } from "@/components/TeamFlag";
import { trCountry } from "@/lib/i18n";

export const metadata: Metadata = { title: "Eleme Turu" };

export default async function ElemePage() {
  const { data, stale } = await getBracket();
  const { qualification } = data;

  return (
    <>
      <StaleBanner stale={stale} />
      <Container className="py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Eleme Aşaması
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Yeni 2026 formatı: Son 32 → Son 16 → Çeyrek Final → Yarı Final →
          Final. 24 grup + en iyi 8 üçüncü = 32 takım.
        </p>

        {data.bracket.provisional && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            Eşleşmeler geçicidir. Gruplar 27 Haziran'da tamamlanınca eleme
            ağacı kesinleşecek.
          </div>
        )}

        {/* Kalifikasyon tablosu */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-white">
            Tur Atlama Durumu
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qualification.groups.map((g) => (
              <Card key={g.groupId} className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Grup {g.groupId}
                  </h3>
                  {!g.complete && <Pill tone="amber">Devam ediyor</Pill>}
                </div>
                <QualRow rank={1} team={g.winner} tone="emerald" />
                <QualRow rank={2} team={g.runnerUp} tone="emerald" />
                {g.third && <QualRow rank={3} team={g.third.team} tone="amber" />}
              </Card>
            ))}
          </div>
        </section>

        {/* En iyi üçüncüler */}
        {qualification.thirds.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-1 text-lg font-bold text-white">
              En İyi Üçüncüler Yarışı
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              İlk 8 sıra eleme turuna kalır (puan → averaj → atılan gol).
            </p>
            <Card className="divide-y divide-white/5 p-2">
              {qualification.thirds.map((t, i) => (
                <div
                  key={t.row.team.id}
                  className={`flex items-center gap-3 px-2 py-2 ${
                    t.qualifies ? "" : "opacity-50"
                  }`}
                >
                  <span className="w-5 text-center text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <TeamFlag
                    abbr={t.row.team.abbr}
                    logo={t.row.team.logo}
                    name={t.row.team.name}
                    size={22}
                  />
                  <span className="flex-1 truncate text-sm font-medium text-white">
                    {trCountry(t.row.team.name)}
                  </span>
                  <span className="text-xs text-slate-500">Grup {t.groupId}</span>
                  <span className="w-10 text-center font-mono text-sm text-slate-300">
                    {t.row.points} P
                  </span>
                  {t.qualifies && <Pill tone="emerald">Son 32</Pill>}
                </div>
              ))}
            </Card>
          </section>
        )}

        {/* Şematik bracket */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-white">Eleme Ağacı</h2>
          <Card className="p-4">
            <Bracket data={data} />
            {data.bracket.provisional && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Şematik görünüm — eşleşmeler gruplar bitince dolacak.
              </p>
            )}
          </Card>
        </section>
      </Container>
    </>
  );
}

function QualRow({
  rank,
  team,
  tone,
}: {
  rank: number;
  team?: { abbr: string; logo?: string; name: string };
  tone: "emerald" | "amber";
}) {
  const border = tone === "emerald" ? "border-emerald-500" : "border-amber-500";
  return (
    <div
      className={`flex items-center gap-2 border-l-2 ${border} py-1 pl-2 text-sm`}
    >
      <span className="w-3 text-xs text-slate-500">{rank}</span>
      {team ? (
        <>
          <TeamFlag abbr={team.abbr} logo={team.logo} name={team.name} size={18} />
          <span className="truncate text-white">{trCountry(team.name)}</span>
        </>
      ) : (
        <span className="text-slate-500">—</span>
      )}
    </div>
  );
}
