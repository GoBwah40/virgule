"use client";

import { MapPin } from "lucide-react";
import { useSyncExternalStore } from "react";

import { mapSearchUrl } from "@/lib/idea-value";
import { cn } from "@/lib/utils";

type Props = { query: string; label: string; className?: string };

const noop = () => () => {};
// iPhone, iPad (iPadOS reports itself as a Mac) and Mac: the Apple Maps link opens the app.
const isApple = () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

/**
 * "View on the map" link that opens the installed app: Apple Maps on Apple, Google Maps
 * elsewhere. The server render targets Google Maps, then the browser adjusts.
 */
export function MapLink({ query, label, className }: Props) {
  const apple = useSyncExternalStore(noop, isApple, () => false);
  return (
    <a
      href={mapSearchUrl(query, apple)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "touch-target inline-flex min-h-8 items-center gap-1 rounded-md text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/80",
        className,
      )}
    >
      <MapPin className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
