"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  labels: { retry: string; home: string };
  /** Recharge les données et réaffiche la partie en erreur (`retry` de Next). */
  onRetry: () => void;
  /** Code à communiquer pour retrouver l'erreur dans les logs serveur. */
  details?: string;
  size?: React.ComponentProps<typeof StatusPage>["size"];
};

/** Contenu des pages d'erreur : explication, bouton « Réessayer » et retour à l'accueil. */
export function ErrorFallback({ title, body, labels, onRetry, details, size }: Props) {
  return (
    <StatusPage title={title} body={body} icon={TriangleAlert} details={details} size={size}>
      <Button onClick={onRetry}>
        <RotateCcw data-icon="inline-start" />
        {labels.retry}
      </Button>
      {/* Vrai lien <a> (pas <Link>) : après une erreur, un rechargement complet repart d'un état sain. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- rechargement complet voulu */}
      <Button variant="outline" nativeButton={false} render={<a href="/" />}>
        {labels.home}
      </Button>
    </StatusPage>
  );
}
