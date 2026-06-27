import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { GlobalLayoutWrapper } from "@/components/global-layout-wrapper";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { WhatsAppFloat } from "@/components/whatsapp-float";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EvokeNxt Academe",
  description:
    "Master your ACCA qualification with expert-led courses, structured study materials, and a 95% pass rate. Study online, learn at your pace, succeed globally.",
  manifest: "/manifest.json",
  applicationName: "Evokenxt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Evokenxt",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#5CC593",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <head>
        {/* PWA & Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icons/icon-512x512.png"
        />
      </head>
      <body
        className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0"
        suppressHydrationWarning
      >
        <Providers>
          <GlobalLayoutWrapper>{children}</GlobalLayoutWrapper>
        </Providers>
        <DashboardMobileNav />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
