import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "https://hashtagbillionaire.com/categories",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "node.https://hashtagbillionaire.com/categories",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
