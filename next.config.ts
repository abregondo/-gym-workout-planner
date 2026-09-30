import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wger.de",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "marcmayol.github.io",
        pathname: "/exercise-api/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/yuhonas/free-exercise-db/**",
      },
    ],
  },
};

export default nextConfig;
