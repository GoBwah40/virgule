"use client";

import { MapPin } from "lucide-react";
import { useSyncExternalStore } from "react";

import { mapSearchUrl } from "@/lib/idea-value";
import { cn } from "@/lib/utils";

type Props = { query: string; label: string; className?: string };

const noop = () => () => {};
// iPhone, iPad (iPadOS se présente comme un Mac) et Mac : le lien Plans ouvre l'app.
const isApple = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

/**
 * Lien « Voir sur la carte » qui ouvre l'app installée : Plans sur Apple, Google Maps
 * ailleurs. Le rendu serveur vise Google Maps, puis le navigateur ajuste.
 */
export function MapLink({ query, label, className }: Props) {
  const apple = useSyncExternalStore(noop, isApple, () => false);
  return (
    <a
      href={mapSearchUrl(query, apple)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-md text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <MapPin className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
