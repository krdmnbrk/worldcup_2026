// 2026 Dünya Kupası stadyumları — kapasite, rakım ve çatı bilgisi (statik, küratörlü).
// ESPN venue adı/şehri ile eşlenir (anahtarsız API'de bu detaylar güvenilir gelmiyor).

export interface VenueInfo {
  capacity?: number;
  altitude?: number; // metre (yalnızca anlamlı yükseklikler)
  roof?: string; // "Kapalı" | "Açılır çatı"
  cityTr?: string;
}

interface VenueEntry extends VenueInfo {
  keys: string[]; // ESPN venue adında aranacak küçük-harf parçalar
}

const VENUES: VenueEntry[] = [
  { keys: ["azteca", "banorte"], capacity: 83264, altitude: 2240, cityTr: "Mexico City" },
  { keys: ["akron"], capacity: 48071, altitude: 1566, cityTr: "Guadalajara" },
  { keys: ["bbva"], capacity: 53500, altitude: 540, cityTr: "Monterrey" },
  { keys: ["metlife"], capacity: 82500, cityTr: "East Rutherford" },
  { keys: ["at&t", "at&t stadium", "dallas"], capacity: 80000, roof: "Açılır çatı", cityTr: "Arlington" },
  { keys: ["mercedes-benz", "mercedes benz"], capacity: 71000, roof: "Açılır çatı", cityTr: "Atlanta" },
  { keys: ["nrg"], capacity: 72220, roof: "Açılır çatı", cityTr: "Houston" },
  { keys: ["arrowhead"], capacity: 76416, cityTr: "Kansas City" },
  { keys: ["sofi"], capacity: 70000, roof: "Kapalı", cityTr: "Inglewood" },
  { keys: ["hard rock"], capacity: 64767, cityTr: "Miami" },
  { keys: ["lincoln financial"], capacity: 69596, cityTr: "Philadelphia" },
  { keys: ["levi's", "levis"], capacity: 68500, cityTr: "Santa Clara" },
  { keys: ["lumen"], capacity: 68740, cityTr: "Seattle" },
  { keys: ["bmo"], capacity: 45000, cityTr: "Toronto" },
  { keys: ["bc place"], capacity: 54500, roof: "Açılır çatı", cityTr: "Vancouver" },
  { keys: ["gillette"], capacity: 65878, cityTr: "Foxborough" },
];

export function venueInfo(name?: string, city?: string): VenueInfo | undefined {
  const n = (name || "").toLowerCase();
  const c = (city || "").toLowerCase();
  if (!n && !c) return undefined;
  for (const v of VENUES) {
    if (v.keys.some((k) => n.includes(k))) return v;
  }
  // şehir ile yedek eşleşme
  for (const v of VENUES) {
    if (v.cityTr && c.includes(v.cityTr.toLowerCase())) return v;
  }
  return undefined;
}
