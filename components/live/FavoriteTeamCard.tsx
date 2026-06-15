"use client";

import { useFavoriteTeam } from "@/components/useFavoriteTeam";
import { MatchCard } from "@/components/MatchCard";
import { SectionTitle } from "@/components/ui";
import { trCountry } from "@/lib/i18n";
import type { Match } from "@/lib/domain/types";

// Ana sayfada, kullanıcının takip ettiği takımın canlı/son/sonraki maçı.
// Favori yoksa veya maçı yoksa görünmez.
export function FavoriteTeamCard({ matches }: { matches: Match[] }) {
  const { fav } = useFavoriteTeam();
  if (!fav) return null;

  const teamMatches = matches
    .filter((m) => m.home.id === fav || m.away.id === fav)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  if (!teamMatches.length) return null;

  const first = teamMatches[0];
  const team = first.home.id === fav ? first.home : first.away;
  const live = teamMatches.find((m) => m.status === "in");
  const last = [...teamMatches].reverse().find((m) => m.status === "post");
  const next = teamMatches.find((m) => m.status === "pre");
  const show = [live, last, next].filter(
    (m, i, arr): m is Match => !!m && arr.indexOf(m) === i,
  );

  return (
    <section>
      <SectionTitle
        title={`★ Takip ettiğin: ${trCountry(team.name)}`}
        href={`/takimlar/${fav}`}
        hrefLabel="Takım"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {show.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}
