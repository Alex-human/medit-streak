import type { NextConfig } from "next";

const isNativeExport = process.env.NEXT_OUTPUT_MODE === "export";

const nextConfig: NextConfig = {
  output: isNativeExport ? "export" : undefined,
  trailingSlash: isNativeExport,
  images: {
    unoptimized: isNativeExport,
  },
};

export default nextConfig;
