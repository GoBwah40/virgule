"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";

import { ErrorFallback } from "@/components/error-fallback";
import { defaultLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/locale";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

import { fontVariables } from "./fonts";
import "./globals.css";

const MESSAGES: Record<Locale, typeof en> = { en, fr };

// Same rule as the server (saved choice, then device language), read in the browser.
const browserLocale = () =>
  resolveLocale(
    document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1],
    navigator.languages.join(","),
  );
const noSubscription = () => () => {};

/**
 * Last resort: error in the root layout. This file replaces it entirely, so it must
 * provide <html>, <body>, styles, fonts and translations itself.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = useSyncExternalStore(noSubscription, browserLocale, () => defaultLocale);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-base">
        <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Europe/Paris">
          <GlobalErrorContent digest={error.digest} retry={retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function GlobalErrorContent({ digest, retry }: { digest?: string; retry: () => void }) {
  const t = useTranslations("errorPage");
  return (
    <>
      <title>{t("title")}</title>
      <ErrorFallback
        title={t("title")}
        body={t("body")}
        labels={{ retry: t("retry"), home: t("home") }}
        onRetry={retry}
        details={digest ? t("digest", { digest }) : undefined}
      />
    </>
  );
}
