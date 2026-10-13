"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  /** Already translated: the gear button's accessible name, the dialog title and its close button. */
  labels: { trigger: string; title: string; close: string };
  /** The settings themselves: each one applies as soon as it changes, nothing to submit. */
  children: React.ReactNode;
  className?: string;
};

/** Gear button that opens settings in a dialog, where a side column has no room (phones). */
export function SettingsDialog({ labels, children, className }: Props) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="icon" className={className} aria-label={labels.trigger} title={labels.trigger} />}>
        <Settings />
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md" closeLabel={labels.close}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">{labels.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
