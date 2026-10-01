import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Security headers on every response. No full CSP: Next.js inline scripts would require
// nonces (dynamic rendering everywhere); `frame-ancestors` alone already blocks clickjacking.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // Lets several people test locally: localhost and 127.0.0.1 have separate cookies.
  allowedDevOrigins: ["127.0.0.1"],
  // Release notes read from disk by the home page: bundle them into the deployed function.
  outputFileTracingIncludes: { "/": ["./release-notes/*/*.md"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
