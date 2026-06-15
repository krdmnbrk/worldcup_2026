"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobil alt sekme çubuğu — başparmak erişim bölgesinde, sabit. Masaüstünde gizli.
const TABS = [
  { href: "/", label: "Ana", icon: "🏠" },
  { href: "/fikstur", label: "Fikstür", icon: "📅" },
  { href: "/gruplar", label: "Gruplar", icon: "🏆" },
  { href: "/istatistikler", label: "İstatistik", icon: "📊" },
  { href: "/turkiye", label: "Türkiye", icon: "🇹🇷" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070b14]/95 backdrop-blur md:hidden"
      aria-label="Alt menü"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-emerald-300" : "text-slate-400"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
