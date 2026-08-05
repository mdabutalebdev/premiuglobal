import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Allow images from any host — admins paste product image URLs from many
    // CDNs (Cloudinary, Shopify, Alibaba, Daraz, etc.). A restrict-list caused
    // "hostname not configured" runtime errors on next/image.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
