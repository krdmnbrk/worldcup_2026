import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { LiveBar } from "@/components/live/LiveBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SITE } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const BASE = process.env.NODE_ENV === "production" ? "/worldcup_2026" : "";

export const metadata: Metadata = {
  title: {
    default: SITE.longTitle,
    template: `%s · ${SITE.title}`,
  },
  description:
    "2026 FIFA Dünya Kupası'nı takip edin: canlı skorlar, fikstür, grup tabloları, eleme ağacı, istatistikler ve oyuncu profilleri.",
  applicationName: SITE.title,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE.title,
  },
  icons: {
    icon: `${BASE}/icons/icon-192.png`,
    apple: `${BASE}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <Nav />
        {/* Alt navigasyon + canlı çubuk için mobilde alt boşluk (safe-area dahil) */}
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
        <Footer />
        <LiveBar />
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
