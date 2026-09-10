import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Минимальный self-contained билд для Docker — see Dockerfile.
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
