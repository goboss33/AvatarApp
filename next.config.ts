import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.heygen.com" },
      { protocol: "https", hostname: "api.heygen.com" },
    ],
  },
};

export default nextConfig;
