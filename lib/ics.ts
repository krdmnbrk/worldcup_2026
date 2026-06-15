// Basit .ics (iCalendar) üretici — maçları takvime eklemek için. Saf, bağımlılıksız.

export interface IcsEvent {
  id: string;
  start: string; // ISO
  durationMin?: number;
  title: string;
  location?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICS(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

function esc(s: string): string {
  return String(s)
    .replace(/[\\;,]/g, (m) => "\\" + m)
    .replace(/\n/g, "\\n");
}

export function buildICS(events: IcsEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC2026 Takip//TR",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    if (!e.start) continue;
    const startMs = new Date(e.start).getTime();
    const end = new Date(startMs + (e.durationMin ?? 120) * 60000).toISOString();
    lines.push(
      "BEGIN:VEVENT",
      `UID:wc2026-${e.id}@krdmnbrk.github.io`,
      `DTSTAMP:${toICS(e.start)}`,
      `DTSTART:${toICS(e.start)}`,
      `DTEND:${toICS(end)}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
