// Tüm tarih/saat biçimlemesi Europe/Istanbul ve tr-TR yereli ile yapılır.
// ESPN saatleri UTC'dir (".../...Z").

const TZ = "Europe/Istanbul";
const LOCALE = "tr-TR";

function toDate(iso: string): Date {
  return new Date(iso);
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(toDate(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TZ,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(toDate(iso));
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
    }).format(toDate(iso));
  } catch {
    return iso;
  }
}

export function formatDayShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TZ,
      day: "numeric",
      month: "short",
      weekday: "short",
    }).format(toDate(iso));
  } catch {
    return iso;
  }
}

export function weekdayLong(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      timeZone: TZ,
      weekday: "long",
    }).format(toDate(iso));
  } catch {
    return "";
  }
}

// Istanbul saatine göre "YYYY-MM-DD" anahtarı (aynı güne grupla)
export function istanbulDayKey(iso: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(toDate(iso));
    return parts; // en-CA → YYYY-MM-DD
  } catch {
    return iso.slice(0, 10);
  }
}

// "YYYYMMDD" (ESPN scoreboard dates parametresi için, UTC tabanlı)
export function ymdUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function isPast(iso: string, now: Date): boolean {
  return toDate(iso).getTime() < now.getTime();
}

// Bir ISO tarihin bugüne göre kaç gün uzakta olduğunu döndürür (Istanbul günü bazında).
export function dayDiffFromNow(iso: string, now: Date): number {
  const a = istanbulDayKey(iso);
  const b = istanbulDayKey(now.toISOString());
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((da - db) / 86400000);
}

export function relativeDayLabel(iso: string, now: Date): string {
  const diff = dayDiffFromNow(iso, now);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  if (diff === -1) return "Dün";
  return formatDayShort(iso);
}
