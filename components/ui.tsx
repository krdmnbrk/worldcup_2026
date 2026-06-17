import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  href,
  hrefLabel = "Tümü",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white sm:text-xl">
          <span className="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 pl-3.5 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="-m-2 inline-flex shrink-0 items-center gap-1 p-2 text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "red" | "blue" | "indigo";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-700/40 text-slate-300 ring-slate-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    red: "bg-red-500/15 text-red-300 ring-red-500/30",
    blue: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
    indigo: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-500/40">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-400" />
      Canlı
    </span>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function StaleBanner({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10">
      <Container className="py-2">
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Canlı veriye şu an ulaşılamıyor — son bilinen veriler gösteriliyor.
        </p>
      </Container>
    </div>
  );
}
