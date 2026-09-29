"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorFallback } from "@/components/error-fallback";

/**
 * Erreur dans une étape de la séance. Ce fichier ne couvre pas le layout du même segment :
 * l'en-tête (nom, étapes, sièges) reste affiché au-dessus du message.
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
