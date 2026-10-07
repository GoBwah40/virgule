"use client";

import { Pencil } from "lucide-react";
import { useId, useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  /** Current name, filled in each time the dialog opens. */
  value: string;
  maxLength: number;
  labels: {
    /** Accessible name of the pencil button. */
    trigger: string;
    title: string;
    description?: string;
    field: string;
    submit: string;
    close: string;
  };
  pending?: boolean;
  /** Saves the new name (already trimmed); calls `done` once saved, which closes the dialog. */
  onSubmit: (value: string, done: () => void) => void;
  className?: string;
};

/** Discreet pencil button that opens a one-field form to rename something. */
export function RenameDialog({ value, maxLength, labels, pending = false, onSubmit, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const trimmed = draft.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className={cn("text-muted-foreground", className)} aria-label={labels.trigger} title={labels.trigger} />}
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" closeLabel={labels.close}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!trimmed || trimmed === value) return;
            onSubmit(trimmed, () => setOpen(false));
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">{labels.title}</DialogTitle>
            {labels.description && <DialogDescription>{labels.description}</DialogDescription>}
          </DialogHeader>
          <FormField id={id} label={labels.field}>
            <Input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={maxLength} required autoComplete="off" />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={pending || !trimmed || trimmed === value}>
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
