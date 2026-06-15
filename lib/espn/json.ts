// Bilinmeyen (unknown) JSON üzerinde tip-güvenli erişim yardımcıları. ESPN şeması
// değişken olduğundan derin gezinmede `any` pragmatiktir; ancak basit/kararlı
// yollarda (standings/teams) bu yardımcılar `any`yi `unknown` ile değiştirip
// güvenli daraltma sağlar.

export type Json = Record<string, unknown>;

// Bir değeri nesne olarak ele al (değilse boş nesne) — zincirleme erişim için.
export function obj(v: unknown): Json {
  return typeof v === "object" && v !== null ? (v as Json) : {};
}

// Bir değeri dizi olarak ele al (değilse boş dizi).
export function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// String/sayı/boolean → string; nesne/null/undefined → undefined.
export function str(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}
