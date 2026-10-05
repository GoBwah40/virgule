"use client";

import { useSyncExternalStore } from "react";

import { QrCode } from "@/components/qr-code";
import { cn } from "@/lib/utils";

type Props = {
  /** Link to join, from the site root (e.g. "/r/abc123"). */
  path: string;
  /** Caption under the code (e.g. "Scan to join"). */
  label: string;
  /** Description of the code read by screen readers. */
  qrLabel: string;
  /** `lg`: scanned from the back of the room; `sm`: a corner of the screen, for latecomers. */
  size?: "lg" | "sm";
  className?: string;
};

const noSubscription = () => () => {};

/** QR code to join the session from the room screen, with its caption. */
export function PresentationJoin({ path, label, qrLabel, size = "lg", className }: Props) {
  // The absolute link needs the browser's origin: an empty square of the same size until then.
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => null);

  return (
    <figure
      className={cn(
        "grid justify-items-center gap-[0.6em] font-semibold",
        size === "lg" ? "w-[min(100%,clamp(13rem,min(27vw,48vh),36rem))] stage-sm" : "w-[clamp(6rem,min(9vw,16vh),12rem)] stage-xs",
        className,
      )}
    >
      {origin ? (
        <QrCode value={`${origin}${path}`} label={qrLabel} className={cn("w-full", size === "lg" ? "rounded-[1.4em] p-[7%]" : "p-[6%]")} />
      ) : (
        <div className="aspect-square w-full rounded-xl bg-card" />
      )}
      <figcaption className="text-center">{label}</figcaption>
    </figure>
  );
}
