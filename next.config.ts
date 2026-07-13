import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Evita o Next confundir o workspace root com um lockfile solto em ~
  turbopack: { root: __dirname },
};

// i18n cookie-based (sem /[locale]/ nas URLs) — config em i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
