// next.config.js (or next.config.mjs)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hosts the image optimizer (/_next/image) may fetch from (SEC-008). Only
    // optimized <Image>s use it: brand logos, use-case and category tiles, the
    // gallery, and the product gallery's fullscreen view. ProxyImage and other
    // `unoptimized` images load directly and are not affected by this list.
    // Every entry is a host the shop's data or code uses (checked against the
    // live catalogue on 2026-11-20). A new image host must be added here before
    // data points at it, or those optimized images fail with HTTP 400.
    remotePatterns: [
      // Shop backend (NEXT_PUBLIC_IMAGE_URL): admin uploads and rehosted supplier images.
      { protocol: "https", hostname: "node.hashtagbillionaire.com", port: "", pathname: "/images/**" },
      { protocol: "https", hostname: "node.hashtagbillionaire.com", port: "", pathname: "/uploads/**" },
      // SAGE supplier images (product attachments): only the picture endpoint.
      { protocol: "https", hostname: "www.promoplace.com", port: "", pathname: "/ws/ws.dll/QPic" },
      // SanMar supplier images.
      { protocol: "https", hostname: "cdnm.sanmar.com", port: "" },
      // S&S Activewear product images (www redirects to the CDN), and the CDN
      // that src/lib/images.ts builds S&S media URLs on.
      { protocol: "https", hostname: "www.ssactivewear.com", port: "", pathname: "/Images/**" },
      { protocol: "https", hostname: "cdn.ssactivewear.com", port: "" },
    ],
    // SVGs are never optimized (dangerouslyAllowSVG keeps its default, false).
    // next/image serves .svg sources such as /placeholder.svg unoptimized, and
    // admin uploads can't be SVG.
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Browsers request /favicon.ico by convention; the site ships favicon.png.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.png" }];
  },
  // The emailed-code pages were replaced by emailed links (backend security update).
  async redirects() {
    return [
      { source: "/send-otp", destination: "/forgot-password", permanent: false },
      { source: "/verify-otp", destination: "/login", permanent: false },
      // Short link to the Sourcing Request form (used by the Full Front no-price popup).
      { source: "/contact", destination: "/contact-us", permanent: false },
    ];
  },
};

module.exports = nextConfig;