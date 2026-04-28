// next.config.js (or next.config.mjs)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow all domains since proxy-image route handles the actual fetching
    remotePatterns: [
      {
        // Your own proxy route — always allow
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/proxy-image**",
      },
      {
        protocol: "https",
        hostname: "**", // wildcard: let the proxy route handle security
        pathname: "**",
      },
    ],
    // Disable Next.js built-in optimisation for proxied images
    // (the proxy returns the raw image, optimisation can be added separately)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;