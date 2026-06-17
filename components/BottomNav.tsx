"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Trophy, BarChart3, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Mobil alt sekme çubuğu — başparmak erişim bölgesinde, sabit. Masaüstünde gizli.
const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Ana", icon: Home },
  { href: "/fikstur", label: "Fikstür", icon: CalendarDays },
  { href: "/gruplar", label: "Gruplar", icon: Trophy },
  { href: "/istatistikler", label: "İstatistik", icon: BarChart3 },
  { href: "/turkiye", label: "Türkiye", icon: Star },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0b1120]/95 backdrop-blur-md md:hidden"
      aria-label="Alt menü"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((t) => {
          const active = isActive(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-amber-300" : "text-slate-400"
              }`}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-amber-400" />
              )}
              <Icon
                className="h-[1.35rem] w-[1.35rem]"
                strokeWidth={active ? 2.4 : 1.9}
                aria-hidden
              />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
