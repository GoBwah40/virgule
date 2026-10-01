"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Destructive confirmation, even when the button itself is not (default: follows `variant`). */
  destructive?: boolean;
  onConfirm: () => void;
};

/** Button that asks for confirmation before a major action (phase change…). */
export function ConfirmButton({ title, description, confirmLabel, destructive, onConfirm, children, ...props }: Props) {
  const [open, setOpen] = useState(false);

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
        confirmLabel={confirmLabel ?? children}
        destructive={destructive ?? props.variant === "destructive"}
        onConfirm={onConfirm}
      />
    </>
  );
}
