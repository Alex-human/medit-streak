import type { NextConfig } from "next";

const isNativeExport = process.env.NEXT_OUTPUT_MODE === "export";

const nextConfig: NextConfig = {
  output: isNativeExport ? "export" : undefined,
  trailingSlash: isNativeExport,
  images: {
    unoptimized: isNativeExport,
  },
  experimental: {
    // La caché de disco de Turbopack para builds sirvió CSS de un commit anterior (22/09 y 26/09): este proyecto compila en segundos sin ella.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
