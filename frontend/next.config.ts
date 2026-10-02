import type { NextConfig } from "next";

// Только для локальной разработки через туннель (cloudflared): если задан
// API_PROXY_TARGET, Next проксирует /api/v1/* на бэкенд, и фронт с API живут
// на одном домене — refresh-cookie работает без CORS. В проде не задан.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Минимальный self-contained билд для Docker — see Dockerfile.
  output: "standalone",
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Dev-сервер иначе блокирует запросы к dev-ресурсам с чужого домена туннеля.
  allowedDevOrigins: ["*.trycloudflare.com"],
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/v1/:path*", destination: `${apiProxyTarget}/api/v1/:path*` }];
  },
};

export default nextConfig;
