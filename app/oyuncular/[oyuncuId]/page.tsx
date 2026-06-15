import Link from "next/link";
import type { Metadata } from "next";
import { getPlayer, getPlayerIndex, getAllMatches } from "@/lib/data";
import {
  Container,
  Card,
  SectionTitle,
  StaleBanner,
  EmptyState,
} from "@/components/ui";
import { PlayerImage } from "@/components/PlayerImage";
import { TeamFlag } from "@/components/TeamFlag";
import { PlayerBioLive } from "@/components/live/PlayerBioLive";
import { trCountry, eventTypeLabel } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";
import type { EventType } from "@/lib/domain/types";

export async function generateStaticParams() {
  // Kadro dizinindeki oyuncular + maç olaylarında geçen (gol/kart) oyuncular —
  // böylece zaman çizelgesindeki her isim tıklanınca sayfası mevcut olur.
  const [{ data: index }, { data: matches }] = await Promise.all([
    getPlayerIndex(),
    getAllMatches(),
  ]);
  const ids = new Set(index.map((p) => p.id));
  for (const m of matches)
    for (const e of m.events) if (e.playerId) ids.add(e.playerId);
  return [...ids].map((id) => ({ oyuncuId: id }));
}

const ICONS: Record<EventType, string> = {
  goal: "⚽",
  penalty: "⚽",
  "own-goal": "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "🔁",
  var: "📺",
  other: "•",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ oyuncuId: string }>;
}): Promise<Metadata> {
  const { oyuncuId } = await params;
  try {
    const { data } = await getPlayer(oyuncuId);
    return { title: data.player.name };
  } catch {
    return { title: "Oyuncu" };
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ oyuncuId: string }>;
}) {
  const { oyuncuId } = await params;
  const { data, stale } = await getPlayer(oyuncuId);
  const { player, goals, penalties, yellow, red, appearances } = data;

  const facts: [string, string | undefined][] = [
    ["Mevki", player.position],
    ["Forma No", player.jersey ? `#${player.jersey}` : undefined],
    ["Uyruk", player.nationality ? trCountry(player.nationality) : undefined],
    ["Kulüp", player.club],
    ["Yaş", player.age ? `${player.age}` : undefined],
    ["Doğum", player.dob ? formatDate(player.dob) : undefined],
    ["Boy", player.height],
    ["Kilo", player.weight],
  ];

  return (
    <>
      <StaleBanner stale={stale} />
      <section className="border-b border-white/10 bg-gradient-to-b from-slate-900/60 to-transparent">
        <Container className="py-8">
          <div className="flex items-center gap-5">
            <PlayerImage
              id={player.id}
              src={player.headshot}
              name={player.name}
              size={104}
              className="ring-2 ring-white/10"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {player.name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {[
                  player.position,
                  player.nationality ? trCountry(player.nationality) : null,
                  player.club,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-8">
        {/* WC katkıları */}
        <section>
          <SectionTitle
            title="Dünya Kupası Katkıları"
            subtitle={`${appearances.length} maçta forma giydi`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Gol" value={goals} accent="emerald" />
            <Metric label="Penaltı golü" value={penalties} accent="emerald" />
            <Metric label="Sarı kart" value={yellow} accent="amber" />
            <Metric label="Kırmızı kart" value={red} accent="red" />
          </div>
        </section>

        {/* Künye */}
        <section>
          <SectionTitle title="Künye" />
          <Card className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
            {facts
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="text-sm font-semibold text-white">{v}</dd>
                </div>
              ))}
          </Card>
          {player.nationality && (
            <p className="mt-3 text-xs text-slate-500">
              Not: ESPN milli takım oyuncuları için sınırlı biyografik veri
              sağlar; ek kariyer geçmişi her zaman mevcut olmayabilir.
            </p>
          )}
        </section>

        {/* Kulüp & sezon (tarayıcıda ESPN'den) */}
        <PlayerBioLive id={player.id} />

        {/* Sezon istatistikleri */}
        {player.seasonStats && player.seasonStats.length > 0 && (
          <section>
            <SectionTitle title="Sezon İstatistikleri" subtitle="Kulüp (güncel sezon)" />
            <Card className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
              {player.seasonStats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-slate-500">{s.label}</dt>
                  <dd className="text-sm font-semibold text-white">{s.value}</dd>
                </div>
              ))}
            </Card>
          </section>
        )}

        {/* Maç maç katkılar */}
        <section>
          <SectionTitle title="Maç Performansı" />
          {appearances.length ? (
            <div className="space-y-2">
              {appearances.map(({ match, events }) => (
                <Link
                  key={match.id}
                  href={`/maclar/${match.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-emerald-500/40 hover:bg-white/[0.06]"
                >
                  <span className="w-24 shrink-0 text-xs text-slate-500">
                    {formatDate(match.date)}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <TeamFlag
                      abbr={match.home.abbr}
                      logo={match.home.logo}
                      name={match.home.name}
                      size={18}
                    />
                    <span className="text-xs font-medium text-white">
                      {match.home.score ?? "-"} : {match.away.score ?? "-"}
                    </span>
                    <TeamFlag
                      abbr={match.away.abbr}
                      logo={match.away.logo}
                      name={match.away.name}
                      size={18}
                    />
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {events.map((e, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-300"
                        title={eventTypeLabel(e.type)}
                      >
                        {ICONS[e.type]} {e.minute}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Bu turnuvada gol/kart kaydı bulunamadı."
              hint="Oyuncu sahaya çıkmış olsa da öne çıkan bir olayı olmayabilir."
            />
          )}
        </section>
      </Container>
    </>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "emerald" | "amber" | "red";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "amber"
        ? "text-amber-300"
        : "text-red-300";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}
