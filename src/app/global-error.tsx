"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";
import { defaultLocale } from "@/i18n/config";
import messages from "../../messages/fr.json";

import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * Dernier recours : erreur dans le layout racine. Ce fichier le remplace entièrement,
 * il doit donc fournir lui-même <html>, <body>, les styles, les polices et les traductions.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={defaultLocale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-base">
        <NextIntlClientProvider locale={defaultLocale} messages={messages} timeZone="Europe/Paris">
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
