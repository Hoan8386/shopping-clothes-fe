import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const configDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "frostlike-grime-trimester.ngrok-free.dev", // Đổi thành domain mới
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://frostlike-grime-trimester.ngrok-free.dev/api/v1/:path*", // Đổi thành domain mới
      },
    ];
  },
};

export default nextConfig;