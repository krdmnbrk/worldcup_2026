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
  "United States": "Amerika Birleşik Devletleri",
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
  "United Arab Emirates": "Birleşik Arap Emirlikleri",
};

export function trCountry(name: string): string {
  return TR_COUNTRY[name] ?? name;
}
