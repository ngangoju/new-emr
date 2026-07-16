import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy the backend through the same origin (Vercel) so the auth cookie
    // (HttpOnly accessToken, Set-Cookie from the backend) lands on the
    // vercel.app domain instead of the backend's onrender.com domain.
    //
    // Without this, the cross-site cookie is never visible to the Next.js
    // server-side proxy (src/proxy.ts), which reads request.cookies — so every
    // authenticated navigation bounced back to /login even though the client
    // actually had a session. Routing all API traffic through /backend makes
    // the auth cookie first-party and removes the need for SameSite=None/CORS
    // gymnastics.
    //
    // Login CX still works directly against the backend; the rewrite only
    // affects browser/frontend-initiated calls (axios baseURL = /backend).
    return [
      {
        source: "/backend/:path*",
        destination:
          (process.env.NEXT_PUBLIC_API_URL &&
          !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
            ? process.env.NEXT_PUBLIC_API_URL
            : "https://new-emr-backend.onrender.com") + "/:path*",
      },
    ];
  },
};

export default nextConfig;
