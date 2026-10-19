import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxy same-origin: el navegador habla con /api de su propio origen y Next
  // reenvia al backend, asi evitamos CORS sin tocar el backend. El puerto del
  // backend queda en un unico lugar (BACKEND_URL, por defecto :3000).
  async rewrites() {
    const destino = process.env.BACKEND_URL ?? "http://localhost:3000";
    return [{ source: "/api/:path*", destination: `${destino}/:path*` }];
  },
};

export default nextConfig;
