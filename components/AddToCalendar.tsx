"use client";

import { buildICS } from "@/lib/ics";
import { trCountry } from "@/lib/i18n";
import type { Match } from "@/lib/domain/types";

export function AddToCalendar({
  matches,
  filename,
  label = "Takvime ekle",
}: {
  matches: Match[];
  filename: string;
  label?: string;
}) {
  if (!matches.length) return null;

  const onClick = () => {
    const ics = buildICS(
      matches.map((m) => ({
        id: m.id,
        start: m.date,
        durationMin: 120,
        title: `${trCountry(m.home.name)} - ${trCountry(m.away.name)} · Dünya Kupası 2026`,
        location: [m.venue.name, m.venue.city].filter(Boolean).join(", "),
      })),
    );
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-emerald-500/40 hover:text-white"
    >
      📅 {label}
    </button>
  );
}
