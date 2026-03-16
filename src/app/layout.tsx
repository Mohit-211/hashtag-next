import type { Metadata } from "next";

import { Inter, Space_Grotesk } from "next/font/google";

import Providers from "./providers";

import { Toaster as Sonner } from "sonner";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable}`}
        suppressHydrationWarning
      >
        <Providers>
          <Header />

          {children}

          <Footer />

          <Sonner position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
