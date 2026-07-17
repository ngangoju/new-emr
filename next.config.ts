import type { NextConfig } from "next";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";

const nextConfig: NextConfig = {
  /**
   * Proxy all /backend/* requests to the Spring backend.
   * This makes the session + CSRF cookies first-party on the Next.js origin,
   * which prevents the auth loss on hard reload (F-003).
   */
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
