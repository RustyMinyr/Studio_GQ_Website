import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Source photography is pre-optimised to responsive WebP assets so both
    // the native Next and Sites builds can serve the same deterministic files.
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
