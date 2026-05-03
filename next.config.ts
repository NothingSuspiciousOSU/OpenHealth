import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@api/nim"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
