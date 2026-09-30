"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";

/** Unexpected error in a page (outside a session): under the root layout, translations available. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorFallback
      title={t("title")}
      body={t("body")}
      labels={{ retry: t("retry"), home: t("home") }}
      onRetry={retry}
      details={error.digest ? t("digest", { digest: error.digest }) : undefined}
    />
  );
}
