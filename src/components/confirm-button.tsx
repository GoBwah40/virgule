"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

/** Bouton qui demande confirmation avant une action structurante (changement de phase…). */
export function ConfirmButton({ title, description, confirmLabel, onConfirm, children, ...props }: Props) {
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
        destructive={props.variant === "destructive"}
        onConfirm={onConfirm}
      />
    </>
  );
}
