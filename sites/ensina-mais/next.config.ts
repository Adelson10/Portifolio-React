import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["172.16.248.2:3000", "localhost:3000"],
    },
  },
  // Sem isto, nenhuma resposta tinha proteção contra clickjacking, MIME-sniffing ou downgrade
  // de protocolo. A CSP fica no proxy.ts (middleware) em vez de aqui porque precisa de um nonce
  // gerado por request (script-src)  ver a função buildCsp lá.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
