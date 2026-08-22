import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fittkereso.b-cdn.net",
        pathname: "/**", // allow all product images
      },
      {
        protocol: "https",
        hostname: "fittkereso-dev.b-cdn.net",
        pathname: "/**", // dev/staging CDN zone — see cdn_url in the backend's config.yaml
      },
    ],
  },
};

export default nextConfig;
