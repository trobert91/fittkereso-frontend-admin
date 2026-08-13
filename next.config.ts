import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fittkereso.b-cdn.net",
        pathname: "/**", // allow all product images
      },
    ],
  },
};

export default nextConfig;
