"use client";

import { Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> & {
  /** Chemin partagé, complété par l'origine du site. */
  path: string;
  /** Titre et message proposés à l'application choisie. */
  title: string;
  text: string;
  label: string;
};

const noop = () => () => {};

/**
 * Ouvre le partage natif du téléphone (messagerie, e-mail…). N'apparaît que si le
 * navigateur le propose : ailleurs, le bouton « Copier le lien » suffit.
 */
export function ShareButton({ path, title, text, label, variant = "outline", ...props }: Props) {
  const supported = useSyncExternalStore(
    noop,
    () => typeof navigator.share === "function",
    () => false,
  );
  if (!supported) return null;

  return (
    <Button
      variant={variant}
      {...props}
      onClick={async () => {
        try {
          await navigator.share({ title, text, url: `${window.location.origin}${path}` });
        } catch {
          // Partage annulé par la personne : rien à signaler.
        }
      }}
    >
      <Share2 data-icon="inline-start" />
      {label}
    </Button>
  );
}
