"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick" | "children" | "value"> & {
  /** Texte copié. */
  value: string;
  /** Préfixe `value` par l'origine du site (pour copier une URL absolue à partir d'un chemin). */
  absolute?: boolean;
  label: string;
  successMessage: string;
  /** Sur mobile, n'affiche que l'icône (le libellé reste lu par les lecteurs d'écran). */
  hideLabelOnMobile?: boolean;
};

export function CopyButton({
  value,
  absolute,
  label,
  successMessage,
  hideLabelOnMobile,
  variant = "outline",
  className,
  ...props
}: Props) {
  return (
    <Button
      variant={variant}
      aria-label={hideLabelOnMobile ? label : undefined}
      // Espace icône/libellé garanti, y compris avec la taille « icon » élargie sur desktop.
      className={cn("gap-2", className)}
      {...props}
      onClick={async () => {
        await navigator.clipboard.writeText(absolute ? `${window.location.origin}${value}` : value);
        toast.success(successMessage);
      }}
    >
      <Link2 data-icon="inline-start" />
      <span className={cn(hideLabelOnMobile && "hidden sm:inline")}>{label}</span>
    </Button>
  );
}
