"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";

/** Unexpected error in a page (outside a session): under the root layout, translations available. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errorPage");
  const tApp = useTranslations("app");

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Client component: no metadata, React puts this <title> in the <head>.
  return (
    <>
      <title>{`${t("title")} · ${tApp("name")}`}</title>
      <ErrorFallback
        title={t("title")}
        body={t("body")}
        labels={{ retry: t("retry"), home: t("home") }}
        onRetry={retry}
        details={error.digest ? t("digest", { digest: error.digest }) : undefined}
      />
    </>
  );
}
