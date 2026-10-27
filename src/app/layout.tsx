import type { Metadata } from "next";

import { Inter } from "next/font/google";

import { Suspense } from "react";
import Providers from "./providers";
import { Toaster as Sonner } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import "./globals.css";
import HistoryManager from "@/components/history/HistoryManager";
import { baseOpenGraph } from "@/lib/seo";
import { ALLOW_INDEXING, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// The site's single font family. Exposed as --font-inter on <html>; every
// font token in globals.css (sans/body/heading/mono) resolves to it.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  keywords: [
    "custom apparel",
    "personalized products",
    "custom t-shirts",
    "streetwear",
    "custom merchandise",
    "custom fashion",
  ],

  authors: [{ name: SITE_NAME }],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  // Staging and previews set NEXT_PUBLIC_NOINDEX=true (see robots.ts).
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },

  icons: {
    icon: "/favicon.png",
  },

  openGraph: {
    ...baseOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },

  // No title or description here, so cards use each page's Open Graph text.
  twitter: {
    card: "summary_large_image",
    images: ["/assets/hero-image.jpg"],
  },
};

/** Points sonner's colour variables at the design tokens in globals.css. */
const mix = (token: string, pct: number) => `color-mix(in srgb, var(--color-${token}) ${pct}%, transparent)`;
const toastTheme = {
  "--normal-bg": "var(--color-card)",
  "--normal-border": "var(--color-border)",
  "--normal-text": "var(--color-foreground)",
  "--success-bg": "var(--color-success-soft)",
  "--success-border": mix("success", 30),
  "--success-text": "var(--color-success)",
  "--error-bg": "var(--color-destructive-soft)",
  "--error-border": mix("destructive", 30),
  "--error-text": "var(--color-destructive)",
  "--warning-bg": "var(--color-primary-soft)",
  "--warning-border": "var(--color-primary)",
  "--warning-text": "var(--color-primary-ink)",
  "--info-bg": "var(--color-muted)",
  "--info-border": "var(--color-border)",
  "--info-text": "var(--color-foreground)",
} as React.CSSProperties;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <Providers>
          {/* Column layout keeps the footer at the bottom on short pages. */}
          <div className="flex min-h-screen flex-col">
            <Header />
            {/* Reads the query string, which needs a Suspense boundary on static pages. */}
            <Suspense fallback={null}>
              <HistoryManager />
            </Suspense>
            <div className="flex-1">{children}</div>
            <Footer />
          </div>

          <Sonner position="top-right" richColors style={toastTheme} />
        </Providers>
      </body>
    </html>
  );
}
