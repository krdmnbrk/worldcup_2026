// Son maçların form göstergesi: G (yeşil) / B (sarı) / M (kırmızı) noktaları.
const TONE: Record<string, string> = {
  W: "bg-emerald-500 text-black",
  D: "bg-amber-500 text-black",
  L: "bg-red-500 text-white",
};
const LETTER: Record<string, string> = { W: "G", D: "B", L: "M" };

export function FormBadge({
  results,
  size = 16,
}: {
  results: (string | undefined)[];
  size?: number;
}) {
  const list = results.filter(Boolean) as string[];
  if (!list.length) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {list.map((r, i) => {
        const key = r.toUpperCase();
        return (
          <span
            key={i}
            style={{ width: size, height: size }}
            className={`grid place-items-center rounded-full text-[9px] font-bold ${
              TONE[key] ?? "bg-slate-600 text-slate-300"
            }`}
          >
            {LETTER[key] ?? r}
          </span>
        );
      })}
    </span>
  );
}
