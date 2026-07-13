import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.8.26"],
  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/_proxy/:path*",
        destination: `${api}/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${api}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
