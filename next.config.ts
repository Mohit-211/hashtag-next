import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "node.hashtagbillionaire.com",
        // removed pathname — allows ALL paths on this hostname
      },
    ],
  },
};

export default nextConfig;
