import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Permet de tester à plusieurs en local : localhost et 127.0.0.1 ont des cookies distincts.
  allowedDevOrigins: ["127.0.0.1"],
  // Notes de version lues sur le disque par l'accueil : à embarquer dans la fonction déployée.
  outputFileTracingIncludes: { "/": ["./release-notes/*.md"] },
};

export default withNextIntl(nextConfig);
