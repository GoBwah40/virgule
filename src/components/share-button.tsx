"use client";

import { Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> & {
  /** Shared path, prefixed with the site origin. */
  path: string;
  /** Title and message offered to the chosen app. */
  title: string;
  text: string;
  label: string;
};

const noop = () => () => {};

/**
 * Opens the phone's native share sheet (messaging, email…). Only shows up if the
 * browser offers it: elsewhere, the "Copy link" button is enough.
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
          // Share cancelled by the person: nothing to report.
        }
      }}
    >
      <Share2 data-icon="inline-start" />
      {label}
    </Button>
  );
}
