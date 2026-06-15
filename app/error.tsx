"use client";

import Link from "next/link";
import { Container } from "@/components/ui";

// İstemci taraflı hata sınırı: bir sayfa render'da beklenmedik hata fırlatırsa
// kullanıcı boş ekran yerine markalı, eyleme dönük bir mesaj görür.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-20 text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-bold text-white">
        Bir şeyler ters gitti
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Sayfa yüklenirken beklenmedik bir hata oluştu. Tekrar deneyebilir ya da
        ana sayfaya dönebilirsiniz.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-500/15 px-4 py-2 font-medium text-emerald-300 hover:bg-emerald-500/25"
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="rounded-lg border border-white/10 px-4 py-2 text-slate-200 hover:bg-white/5"
        >
          Ana sayfa
        </Link>
      </div>
    </Container>
  );
}
