"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";

/**
 * Error in a session step. This file does not cover the layout of the same segment:
 * the header (name, steps, seats) stays displayed above the message.
 */
export default function RoomError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorFallback
      size="section"
      title={t("roomTitle")}
      body={t("roomBody")}
      labels={{ retry: t("retry"), home: t("home") }}
      onRetry={retry}
      details={error.digest ? t("digest", { digest: error.digest }) : undefined}
    />
  );
}
