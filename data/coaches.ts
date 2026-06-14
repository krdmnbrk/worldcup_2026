// ESPN, milli takım antrenörü verisi sağlamıyor. İstenirse buraya elle
// eklenebilir: ESPN takım id'si → teknik direktör adı. Boşsa "Bilinmiyor" gösterilir.
const COACHES: Record<string, string> = {
  // örnek: "660": "Mauricio Pochettino",
};

export function coachFor(teamId: string): string | undefined {
  return COACHES[teamId];
}
