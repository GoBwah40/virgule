"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

/** Bouton qui demande confirmation avant une action structurante (changement de phase…). */
export function ConfirmButton({ title, description, confirmLabel, onConfirm, children, ...props }: Props) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button {...props} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={props.variant === "destructive" ? "destructive" : "default"}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {confirmLabel ?? children}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
