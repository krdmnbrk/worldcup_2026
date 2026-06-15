"use client";

import { useEffect, useState } from "react";

// Sunucusuz kişiselleştirme: favori takım id'si localStorage'da. Bileşenler
// arası senkron için özel "favteam" olayı yayınlanır.
const KEY = "wc2026:favTeam";

export function useFavoriteTeam() {
  const [fav, setFav] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setFav(localStorage.getItem(KEY));
    read();
    window.addEventListener("favteam", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("favteam", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const toggle = (id: string) => {
    const cur = localStorage.getItem(KEY);
    if (cur === id) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, id);
    window.dispatchEvent(new Event("favteam"));
  };

  return { fav, toggle };
}
