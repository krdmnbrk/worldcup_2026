"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Trophy, Menu, X } from "lucide-react";
import { NAV, SITE } from "@/lib/i18n";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0b1120]/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-[#0b1120] shadow-lg shadow-amber-500/25">
            <Trophy className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-white">
              {SITE.title}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
              {SITE.hosts}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 text-slate-200 transition-colors hover:bg-white/5 md:hidden"
          aria-label="Menü"
          aria-expanded={open}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {open && (
        <nav className="grid grid-cols-2 gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex min-h-[2.75rem] items-center rounded-lg px-3 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
