// next.config.js (or next.config.mjs)

/* ── Security response headers (SEC-006) ──
   Production sits behind Cloudflare, which adds none of these (checked on
   2026-11-24), so the app sends them. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing frames the shop: not the admin panel, and no payment flow (Square,
  // Google Pay, Cash App and Turnstile frame their own pages inside ours).
  { key: "X-Frame-Options", value: "DENY" },
];

// Browsers ignore HSTS on plain HTTP, but it is only sent when the visitor came
// over HTTPS (Cloudflare marks this in X-Forwarded-Proto and CF-Visitor).
// includeSubDomains is left out until the full DNS zone has been checked:
// www, admin, node and api all serve HTTPS (2026-11-24), but admin and api also
// answer plain HTTP, and other names can only be listed from Cloudflare.
const HSTS = { key: "Strict-Transport-Security", value: "max-age=31536000" };

/* Content Security Policy, REPORT-ONLY until checkout (Square sandbox, Google
   Pay, Cash App, PayPal) and the other flows have run without violations.
   Built from what the shop loads (a strict-policy crawl of every flow) and the
   vendors' documented lists (Square's Web Payments SDK CSP page, which covers
   Google Pay and Cash App Pay, and Cloudflare's Turnstile CSP page).
   - Square: both production and sandbox hosts, because the SDK is chosen at
     run time from the admin-set application ID.
   - script-src 'unsafe-inline': Next.js puts its page data in inline scripts,
     and the pages are prerendered, so per-request nonces aren't possible.
   - style-src 'unsafe-inline': React style attributes, components' <style>
     elements, and Square's and Google Pay's injected styles (both vendors
     document it).
   - 'wasm-unsafe-eval', blob: and staticimgly.com: the customizer's logo
     background removal (@imgly/background-removal) runs a WebAssembly model.
     It is reached by client-side navigation, so it can't have its own policy.
   - No 'unsafe-eval'. The background-removal library (ndarray) needs eval, so
     with this policy enforced "Remove BG" would fail: decide before enforcing.
     Zod 4 also probes eval once (and falls back), which shows up as a report.
   - img-src: the backend and the supplier image hosts in live data (the same
     list as images.remotePatterns): ProxyImage loads them directly when the
     proxy fails. */
const csp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
    "https://web.squarecdn.com https://sandbox.web.squarecdn.com",
    "https://pay.google.com/gp/p/js/pay.js",
    "https://kit.cash.app/v1/pay.js https://sandbox.kit.cash.app/v1/pay.js",
    "https://challenges.cloudflare.com",
  ].join(" "),
  [
    "style-src 'self' 'unsafe-inline'",
    "https://web.squarecdn.com https://sandbox.web.squarecdn.com",
    "https://kit.cash.app https://sandbox.kit.cash.app",
    "https://fonts.googleapis.com",
  ].join(" "),
  [
    "img-src 'self' data: blob:",
    "https://node.hashtagbillionaire.com",
    "https://www.promoplace.com https://cdnm.sanmar.com https://www.ssactivewear.com https://cdn.ssactivewear.com",
    "https://web.squarecdn.com https://sandbox.web.squarecdn.com",
    "https://www.gstatic.com",
    "https://api.cash.app https://sandbox.api.cash.app https://franklin-assets.s3.amazonaws.com",
  ].join(" "),
  [
    "font-src 'self'",
    "https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
    "https://cash-f.squarecdn.com https://fonts.gstatic.com",
  ].join(" "),
  [
    "connect-src 'self' blob:",
    "https://node.hashtagbillionaire.com",
    "https://web.squarecdn.com https://sandbox.web.squarecdn.com",
    "https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com https://o160250.ingest.sentry.io",
    "https://api.lab.amplitude.com/sdk/vardata",
    // Google Pay's payment method URL; it redirects via www.google.com/pay to pay.google.com.
    "https://pay.google.com https://google.com/pay https://www.google.com/pay",
    "https://staticimgly.com",
  ].join(" "),
  [
    "frame-src",
    "https://web.squarecdn.com https://sandbox.web.squarecdn.com",
    "https://kit.cash.app https://sandbox.kit.cash.app",
    "https://pay.google.com",
    "https://challenges.cloudflare.com",
  ].join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't announce the framework (X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // next dev needs eval for hot reload, so the policy is production-only.
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy-Report-Only", value: csp }]
            : []),
        ],
      },
      { source: "/:path*", has: [{ type: "header", key: "x-forwarded-proto", value: "https" }], headers: [HSTS] },
      { source: "/:path*", has: [{ type: "header", key: "cf-visitor", value: ".*\"scheme\":\"https\".*" }], headers: [HSTS] },
    ];
  },
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