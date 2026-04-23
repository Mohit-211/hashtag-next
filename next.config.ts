// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "example.com",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "cdn.example.com",
//         pathname: "/images/**",
//       },
//       {
//         protocol: "https",
//         hostname: "cdn.example.com",
//         pathname: "/image/**",
//       },

//       // ✅ FIXED
//       {
//         protocol: "https",
//         hostname: "hashtagbillionaire.com",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "maps.googleapis.com",
//       },

//       // ✅ ADD YOUR NEW SOURCES
//       {
//         protocol: "https",
//         hostname: "www.ssactivewear.com",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "www.promoplace.com",
//         pathname: "/**",
//       },
//     ],
//   },
// };

// export default nextConfig;

// next.config.ts
const nextConfig = {
  images: {
    unoptimized: true,
  },
};
export default nextConfig;