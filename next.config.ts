import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['@cloudflare/workers-types'],
  },
  // Cloudflare Pagesでのデプロイ設定
  cloudflare: {
    bindings: {
      // D1データベースのバインディング
      DB: {
        type: 'D1',
        name: 'kiyoshi_diary_prod',
      }
    }
  }
};

export default nextConfig;
