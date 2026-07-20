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
    //
    // The "exclude localhost" guard on NEXT_PUBLIC_API_URL exists so a stray
    // local env var can't accidentally point a Vercel/production build at
    // localhost. It must NOT apply in dev, or every local run with no env var
    // set silently proxies to the production Render backend — whose cookies
    // are Secure and get dropped over plain http://localhost, breaking auth
    // (login "succeeds" but /auth/refresh 401s because no cookie was stored).
    const isDev = process.env.NODE_ENV !== "production";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const explicitUrl = apiUrl && (isDev || !apiUrl.includes("localhost")) ? apiUrl : undefined;
    const fallback = isDev ? "http://localhost:8888" : "https://new-emr-backend.onrender.com";
    return [
      {
        source: "/backend/:path*",
        destination: (explicitUrl || fallback) + "/:path*",
      },
    ];
  },
};

export default nextConfig;
