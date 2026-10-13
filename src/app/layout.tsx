import type { Metadata } from "next";

import { Inter } from "next/font/google";

import { Suspense } from "react";
import Providers from "./providers";
import { Toaster as Sonner } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import "./globals.css";
import HistoryManager from "@/components/history/HistoryManager";

// The site's single font family. Exposed as --font-inter on <html>; every
// font token in globals.css (sans/body/heading/mono) resolves to it.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hashtagbillionaire.com"),

  title: {
    default: "HashtagBillionaire",
    template: "%s | HashtagBillionaire",
  },

  description:
    "A platform for identity, customization, and self-expression through personalized products.",

  keywords: [
    "custom apparel",
    "personalized products",
    "custom t-shirts",
    "streetwear",
    "custom merchandise",
    "custom fashion",
  ],

  authors: [{ name: "HashtagBillionaire" }],

  creator: "HashtagBillionaire",
  publisher: "HashtagBillionaire",

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.png",
  },

  openGraph: {
    title: "HashtagBillionaire",
    description:
      "Express your identity through customizable apparel and lifestyle products.",
    url: "https://hashtagbillionaire.com",
    siteName: "HashtagBillionaire",
    images: [
      {
        url: "/assets/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "HashtagBillionaire",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "HashtagBillionaire",
    description:
      "Express your identity through customizable apparel and lifestyle products.",
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
