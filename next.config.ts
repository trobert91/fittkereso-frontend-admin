import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ebike.b-cdn.net",
        pathname: "/**", // allow all product images
      },
    ],
  },
};

export default nextConfig;
