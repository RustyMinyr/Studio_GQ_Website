import type { NextConfig } from "next";

import { createSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Source photography is pre-optimised to responsive WebP assets so both
    // the native Next and Sites builds can serve the same deterministic files.
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    const headers = createSecurityHeaders(process.env.NODE_ENV === "development");
    return [
      {
        source: "/:path*",
        headers: [...headers],
      },
    ];
  },
};

export default nextConfig;
