import { Container } from "@/components/ui";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20">
      <Container className="py-8">
        <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            2026 FIFA Dünya Kupası Takip Merkezi — gayriresmî, hayran projesi.
          </p>
          <p>
            Veri ve görseller:{" "}
            <span className="text-slate-400">ESPN</span> açık API'si · bayrak
            yedeği <span className="text-slate-400">flagcdn.com</span> · bazı
            oyuncu fotoğrafları{" "}
            <span className="text-slate-400">Wikimedia Commons</span> (CC). Takım
            armaları ilgili federasyonların markasıdır, yalnızca tanıtım amaçlı
            kullanılır.
          </p>
        </div>
      </Container>
    </footer>
  );
}
