import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Lets several people test locally: localhost and 127.0.0.1 have separate cookies.
  allowedDevOrigins: ["127.0.0.1"],
  // Release notes read from disk by the home page: bundle them into the deployed function.
  outputFileTracingIncludes: { "/": ["./release-notes/*/*.md"] },
};

export default withNextIntl(nextConfig);
