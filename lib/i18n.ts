// Türkçe metinler, ülke adı çevirileri ve ESPN istatistik/etiket adlarının TR karşılıkları.

import type { EventType, Stage } from "@/lib/domain/types";

export const SITE = {
  title: "Dünya Kupası 2026",
  subtitle: "Kuzey Amerika · 11 Haziran – 19 Temmuz 2026",
  longTitle: "2026 FIFA Dünya Kupası Takip Merkezi",
  hosts: "ABD · Meksika · Kanada",
};

export const NAV = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/fikstur", label: "Fikstür" },
  { href: "/gruplar", label: "Gruplar" },
  { href: "/eleme", label: "Eleme" },
  { href: "/istatistikler", label: "İstatistikler" },
  { href: "/takimlar", label: "Takımlar" },
  { href: "/turkiye", label: "Türkiye" },
  { href: "/duvar-kagidi", label: "Duvar Kağıdı" },
];

export function stageLabel(stage: Stage): string {
  switch (stage) {
    case "group":
      return "Grup Aşaması";
    case "r32":
      return "Son 32 Turu";
    case "r16":
      return "Son 16 Turu";
    case "qf":
      return "Çeyrek Final";
    case "sf":
      return "Yarı Final";
    case "third":
      return "Üçüncülük Maçı";
    case "final":
      return "Final";
    default:
      return "Maç";
  }
}

export function groupName(groupId?: string): string {
  return groupId ? `Grup ${groupId}` : "";
}

export function eventTypeLabel(type: EventType): string {
  switch (type) {
    case "goal":
      return "Gol";
    case "own-goal":
      return "Kendi Kalesine";
    case "penalty":
      return "Penaltı Golü";
    case "yellow":
      return "Sarı Kart";
    case "red":
      return "Kırmızı Kart";
    case "sub":
      return "Oyuncu Değişikliği";
    case "var":
      return "VAR";
    default:
      return "Olay";
  }
}

// ESPN takım maç istatistiği adları → TR etiketleri
const STAT_LABELS: Record<string, string> = {
  possessionPct: "Topla oynama (%)",
  totalShots: "Şut",
  shotsOnTarget: "İsabetli şut",
  wonCorners: "Korner",
  foulsCommitted: "Faul",
  totalPasses: "Pas",
  accuratePasses: "İsabetli pas",
  passPct: "Pas isabeti (%)",
  offsides: "Ofsayt",
  yellowCards: "Sarı kart",
  redCards: "Kırmızı kart",
  saves: "Kurtarış",
  totalCrosses: "Orta",
  totalTackles: "Müdahale",
  interceptions: "Top kapma",
  blockedShots: "Bloklanan şut",
  totalClearance: "Uzaklaştırma",
};

export function statLabel(name: string): string {
  return STAT_LABELS[name] ?? name;
}

// Maç detayında öne çıkarılacak istatistikler (sıralı)
export const FEATURED_STATS = [
  "possessionPct",
  "totalShots",
  "shotsOnTarget",
  "wonCorners",
  "foulsCommitted",
  "offsides",
  "totalPasses",
  "passPct",
];

// Ülke adı (ESPN İngilizce displayName) → Türkçe
const TR_COUNTRY: Record<string, string> = {
  Mexico: "Meksika",
  "South Africa": "Güney Afrika",
  "South Korea": "Güney Kore",
  "Korea Republic": "Güney Kore",
  Czechia: "Çekya",
  "Czech Republic": "Çekya",
  Canada: "Kanada",
  "Bosnia and Herzegovina": "Bosna-Hersek",
  "Bosnia-Herzegovina": "Bosna-Hersek",
  "United States": "ABD",
  USA: "ABD",
  Paraguay: "Paraguay",
  Qatar: "Katar",
  Switzerland: "İsviçre",
  Brazil: "Brezilya",
  Morocco: "Fas",
  Scotland: "İskoçya",
  Haiti: "Haiti",
  Australia: "Avustralya",
  Turkiye: "Türkiye",
  Turkey: "Türkiye",
  "Türkiye": "Türkiye",
  Germany: "Almanya",
  "Curacao": "Curaçao",
  "Curaçao": "Curaçao",
  Netherlands: "Hollanda",
  Japan: "Japonya",
  "Ivory Coast": "Fildişi Sahili",
  "Cote d'Ivoire": "Fildişi Sahili",
  Ecuador: "Ekvador",
  Sweden: "İsveç",
  Tunisia: "Tunus",
  Spain: "İspanya",
  "Cape Verde": "Yeşil Burun Adaları",
  Argentina: "Arjantin",
  France: "Fransa",
  England: "İngiltere",
  Portugal: "Portekiz",
  Belgium: "Belçika",
  Croatia: "Hırvatistan",
  Uruguay: "Uruguay",
  Colombia: "Kolombiya",
  Senegal: "Senegal",
  Nigeria: "Nijerya",
  Egypt: "Mısır",
  Algeria: "Cezayir",
  Ghana: "Gana",
  Cameroon: "Kamerun",
  Iran: "İran",
  "Saudi Arabia": "Suudi Arabistan",
  Norway: "Norveç",
  Denmark: "Danimarka",
  Poland: "Polonya",
  Austria: "Avusturya",
  Italy: "İtalya",
  "New Zealand": "Yeni Zelanda",
  Panama: "Panama",
  "Costa Rica": "Kosta Rika",
  Jordan: "Ürdün",
  Uzbekistan: "Özbekistan",
  Wales: "Galler",
  "Northern Ireland": "Kuzey İrlanda",
  Serbia: "Sırbistan",
  Greece: "Yunanistan",
  Ukraine: "Ukrayna",
  Peru: "Peru",
  Chile: "Şili",
  "DR Congo": "Demokratik Kongo",
  Jamaica: "Jamaika",
  Honduras: "Honduras",
  "El Salvador": "El Salvador",
  Slovenia: "Slovenya",
  Slovakia: "Slovakya",
  Hungary: "Macaristan",
  Romania: "Romanya",
  Ireland: "İrlanda",
  Iraq: "Irak",
  "United Arab Emirates": "BAE",
};

// Eleme aşamasındaki henüz belli olmayan eşleşmelerde ESPN İngilizce
// yer-tutucu adlar döndürür ("Group C 2nd Place", "Winner Group A" vb.).
// Gerçek ülke listesinde bulunmayan adlar burada Türkçeleştirilir.
function trPlaceholder(name: string): string {
  const s = name.trim();
  const G = "([A-L])"; // grup harfi

  // "Group A/B/C 3rd" gibi birden çok grup harfi içeren üçüncülük yer tutucuları
  if (/\b(?:third|3rd)\b/i.test(s) || /\b(?:3rd|third)\s+place\b/i.test(s)) {
    const letters = s.match(/\b[A-L]\b/g);
    if (letters && letters.length > 1) return `${letters.join("/")} 3.leri`;
    if (letters && letters.length === 1) return `${letters[0]} Grubu 3.sü`;
    return "Gruplar 3.sü";
  }

  // Grup lideri: "Winner Group X" / "Group X Winner"
  let m =
    s.match(new RegExp(`^winner\\s+group\\s+${G}$`, "i")) ||
    s.match(new RegExp(`^group\\s+${G}\\s+winner$`, "i"));
  if (m) return `${m[1].toUpperCase()} Grubu Lideri`;

  // Grup ikincisi: "Runner-Up Group X" / "Group X Runner-Up" / "Group X 2nd Place" / "2nd Place Group X"
  m =
    s.match(new RegExp(`^runner[-\\s]?up\\s+group\\s+${G}$`, "i")) ||
    s.match(new RegExp(`^group\\s+${G}\\s+runner[-\\s]?up$`, "i")) ||
    s.match(new RegExp(`^group\\s+${G}\\s+2nd\\s+place$`, "i")) ||
    s.match(new RegExp(`^2nd\\s+place\\s+group\\s+${G}$`, "i"));
  if (m) return `${m[1].toUpperCase()} Grubu 2.si`;

  // Yer tutucu kalıbı tespit edilmediyse, sızan İngilizce sözcükleri çevir.
  if (/\b(group|winner|runner[-\s]?up|place|best|2nd|3rd)\b/i.test(s)) {
    return s
      .replace(/\brunner[-\s]?up\b/gi, "2.si")
      .replace(/\bwinner\b/gi, "Lideri")
      .replace(/\bbest\b/gi, "En iyi")
      .replace(/\bgroup\b/gi, "Grup")
      .replace(/\bplace\b/gi, ".")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return name;
}

export function trCountry(name: string): string {
  const known = TR_COUNTRY[name];
  if (known) return known;
  return trPlaceholder(name);
}
