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
        hostname: "frostlike-grime-trimester.ngrok-free.dev",
        pathname: "/**",
      },
      // Thêm domain ngrok mới cho hình ảnh
      {
        protocol: "https",
        hostname: "matchbook-unafraid-glitzy.ngrok-free.dev",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://frostlike-grime-trimester.ngrok-free.dev/api/v1/:path*",
      },
      // Thêm rewrite cho api của domain ngrok mới nếu bạn cần chạy song song
      // Lưu ý: Nếu muốn dùng domain mới này làm primary API, bạn có thể comment hoặc xóa rewrite cũ đi nhé
      {
        source: "/api/v1/:path*", 
        destination: "https://matchbook-unafraid-glitzy.ngrok-free.dev/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;