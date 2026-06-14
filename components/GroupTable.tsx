import Link from "next/link";
import type { GroupStanding } from "@/lib/domain/types";
import { TeamFlag } from "@/components/TeamFlag";
import { Pill } from "@/components/ui";
import { trCountry } from "@/lib/i18n";

export function GroupTable({
  group,
  compact = false,
}: {
  group: GroupStanding;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h3 className="text-sm font-bold text-white">{group.groupName}</h3>
        {group.provisional && <Pill tone="amber">Geçici</Pill>}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-3 py-1.5 text-left font-medium">Takım</th>
            <th className="w-8 py-1.5 text-center font-medium">O</th>
            {!compact && (
              <>
                <th className="w-8 py-1.5 text-center font-medium">G</th>
                <th className="w-8 py-1.5 text-center font-medium">B</th>
                <th className="w-8 py-1.5 text-center font-medium">M</th>
                <th className="w-10 py-1.5 text-center font-medium">AV</th>
              </>
            )}
            <th className="w-8 py-1.5 text-center font-bold text-slate-300">P</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((r, i) => {
            const border =
              i < 2
                ? "border-l-2 border-emerald-500"
                : i === 2
                  ? "border-l-2 border-amber-500"
                  : "border-l-2 border-transparent";
            return (
              <tr
                key={r.team.id}
                className={`${border} border-t border-white/5 hover:bg-white/[0.04]`}
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/takimlar/${r.team.id}`}
                    className="flex items-center gap-2"
                  >
                    <span className="w-4 text-center text-xs text-slate-500">
                      {i + 1}
                    </span>
                    <TeamFlag
                      abbr={r.team.abbr}
                      logo={r.team.logo}
                      name={r.team.name}
                      size={22}
                    />
                    <span className="truncate font-medium text-white">
                      {trCountry(r.team.name)}
                    </span>
                  </Link>
                </td>
                <td className="py-2 text-center text-slate-400">{r.played}</td>
                {!compact && (
                  <>
                    <td className="py-2 text-center text-slate-400">{r.w}</td>
                    <td className="py-2 text-center text-slate-400">{r.d}</td>
                    <td className="py-2 text-center text-slate-400">{r.l}</td>
                    <td className="py-2 text-center text-slate-400">
                      {r.gd > 0 ? `+${r.gd}` : r.gd}
                    </td>
                  </>
                )}
                <td className="py-2 text-center font-bold text-white">
                  {r.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
