"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick" | "children" | "value"> & {
  /** Copied text. */
  value: string;
  /** Prefixes `value` with the site origin (to copy an absolute URL from a path). */
  absolute?: boolean;
  label: string;
  successMessage: string;
  /** On mobile, shows only the icon (screen readers still read the label). */
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
      // Guaranteed icon/label gap, including with the "icon" size widened on desktop.
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
