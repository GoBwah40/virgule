import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocale } from "@/i18n/locale";

// No per-language routing: the language picked in the footer (cookie) wins, otherwise the
// device language (Accept-Language) if supported, otherwise English.
export default getRequestConfig(async () => {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value, (await headers()).get("accept-language"));
  return {
    locale,
    // Fixed time zone: avoids date differences between server (UTC) and browser.
    timeZone: "Europe/Paris",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
