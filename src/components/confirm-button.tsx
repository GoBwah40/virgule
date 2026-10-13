"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Destructive confirmation, even when the button itself is not (default: follows `variant`). */
  destructive?: boolean;
  /** Asks in place of the button instead of opening a dialog: required inside a dialog, never two on top of each other. */
  inline?: boolean;
  onConfirm: () => void;
};

/** Button that asks for confirmation before a major action (phase change…). */
export function ConfirmButton({ title, description, confirmLabel, destructive, inline, onConfirm, children, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const label = confirmLabel ?? children;
  const isDestructive = destructive ?? props.variant === "destructive";

  if (inline) {
    return (
      <InlineConfirm
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={label}
        destructive={isDestructive}
        onConfirm={onConfirm}
        button={
          <Button {...props} onClick={() => setOpen(true)}>
            {children}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Button {...props} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={label}
        destructive={isDestructive}
        onConfirm={onConfirm}
      />
    </>
  );
}

type InlineProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: React.ReactNode;
  destructive: boolean;
  onConfirm: () => void;
  button: React.ReactElement;
};

function InlineConfirm({ open, onOpenChange, title, description, confirmLabel, destructive, onConfirm, button }: InlineProps) {
  const t = useTranslations("common");
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Cancelled: focus goes back to the button that asked, not to the top of the dialog.
  useEffect(() => {
    if (wasOpen.current && !open) wrapper.current?.querySelector("button")?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!open) return <div ref={wrapper} className="contents">{button}</div>;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      className="w-full space-y-3 rounded-lg border bg-muted/50 p-3 text-left motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
      // Escape cancels the question, without closing the dialog around it.
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onOpenChange(false);
      }}
    >
      <div className="space-y-1">
        <p id={`${id}-title`} className="font-heading font-semibold">
          {title}
        </p>
        {description && (
          <p id={`${id}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {/* The safe choice takes focus: Enter right after the first click does not confirm. */}
        <Button variant="outline" autoFocus onClick={() => onOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          onClick={() => {
            onOpenChange(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
