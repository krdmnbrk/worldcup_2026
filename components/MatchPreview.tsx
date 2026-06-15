import type { MatchPreview as MatchPreviewData, TeamInMatch, TeamForm } from "@/lib/domain/types";
import { Card } from "@/components/ui";
import { TeamFlag } from "@/components/TeamFlag";
import { FormBadge } from "@/components/FormBadge";
import { trCountry } from "@/lib/i18n";
import { formatDate } from "@/lib/datetime";

function FormColumn({ team, form }: { team: TeamInMatch; form?: TeamForm }) {
  const games = form?.games ?? [];
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <TeamFlag abbr={team.abbr} logo={team.logo} name={team.name} size={22} />
        <span className="flex-1 truncate text-sm font-bold text-white">
          {trCountry(team.name)}
        </span>
        <FormBadge results={games.map((g) => g.result)} />
      </div>
      {games.length ? (
        <ul className="space-y-1">
          {games.map((g, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <span
                className={`w-4 text-center font-bold ${
                  g.result === "W"
                    ? "text-emerald-400"
                    : g.result === "L"
                      ? "text-red-400"
                      : "text-amber-400"
                }`}
              >
                {g.result === "W" ? "G" : g.result === "L" ? "M" : "B"}
              </span>
              <span className="font-mono text-slate-300">{g.score || "-"}</span>
              <span className="flex-1 truncate">
                {g.opponent ? trCountry(g.opponent) : ""}
              </span>
              {g.competition && (
                <span className="shrink-0 text-[10px] text-slate-500">
                  {g.competition}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Form verisi yok.</p>
      )}
    </Card>
  );
}

export function MatchPreview({
  preview,
  home,
  away,
}: {
  preview: MatchPreviewData;
  home: TeamInMatch;
  away: TeamInMatch;
}) {
  const homeForm = preview.teamForm.find((f) => f.teamId === home.id);
  const awayForm = preview.teamForm.find((f) => f.teamId === away.id);
  const hasForm = (homeForm?.games.length || 0) + (awayForm?.games.length || 0) > 0;

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-slate-400">
        Maç henüz oynanmadı — aşağıda maç öncesi bilgiler.
      </p>

      {preview.odds?.detail && (
        <Card className="p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Bahis oranı{preview.odds.provider ? ` · ${preview.odds.provider}` : ""}
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {preview.odds.detail}
          </p>
          {preview.odds.overUnder && (
            <p className="text-xs text-slate-400">
              Alt/Üst: {preview.odds.overUnder}
            </p>
          )}
        </Card>
      )}

      {hasForm && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-white">Son Form</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormColumn team={home} form={homeForm} />
            <FormColumn team={away} form={awayForm} />
          </div>
        </section>
      )}

      {preview.h2h.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-white">
            Son Karşılaşmalar (H2H)
          </h3>
          <Card className="divide-y divide-white/5 p-2">
            {preview.h2h.slice(0, 6).map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-1.5 text-sm"
              >
                <span className="w-24 shrink-0 text-xs text-slate-500">
                  {g.date ? formatDate(g.date) : ""}
                </span>
                <span className="font-mono font-semibold text-white">
                  {g.score || "-"}
                </span>
                <span className="flex-1 truncate text-slate-300">
                  {g.opponent ? `${trCountry(g.opponent)} ile` : ""}
                </span>
                {g.competition && (
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {g.competition}
                  </span>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}

      {!preview.odds?.detail && !hasForm && preview.h2h.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          Bu maç için önizleme verisi bulunamadı.
        </p>
      )}
    </div>
  );
}
