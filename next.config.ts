import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita o Next confundir o workspace root com um lockfile solto em ~
  turbopack: { root: __dirname },
};

export default nextConfig;
