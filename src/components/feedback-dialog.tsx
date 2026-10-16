"use client";

import { Bug, Lightbulb, MessageSquarePlus } from "lucide-react";
import { useId, useState } from "react";

import { FormField } from "@/components/form-field";
import { SegmentedControl } from "@/components/segmented-control";
import { SettingSwitch } from "@/components/setting-switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackKind } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export type FeedbackValues = {
  kind: FeedbackKind;
  title: string;
  description: string;
  includeDetails: boolean;
  /** Hidden field: empty unless a bot filled it in. */
  website: string;
};

type Props = {
  maxLength: { title: number; description: number };
  labels: {
    /** Footer button (only its icon on small screens). */
    trigger: string;
    title: string;
    description: string;
    kind: string;
    idea: string;
    bug: string;
    titleField: string;
    descriptionField: string;
    details: string;
    detailsHint: string;
    submit: string;
    close: string;
  };
  pending?: boolean;
  /** Sends the trimmed values; calls `done` once sent, which closes and empties the form. */
  onSubmit: (values: FeedbackValues, done: () => void) => void;
  className?: string;
};

const EMPTY = { kind: "idea", title: "", description: "", includeDetails: true, website: "" } satisfies FeedbackValues;

/** Footer button that opens a short form to suggest an idea or report a bug. */
export function FeedbackDialog({ maxLength, labels, pending = false, onSubmit, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FeedbackValues>(EMPTY);
  const set = (patch: Partial<FeedbackValues>) => setValues((current) => ({ ...current, ...patch }));
  const title = values.title.trim();
  const description = values.description.trim();
  const ready = Boolean(title && description);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80",
          className,
        )}
        aria-label={labels.trigger}
      >
        <MessageSquarePlus className="size-4" aria-hidden />
        <span className="max-sm:sr-only" aria-hidden>
          {labels.trigger}
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" closeLabel={labels.close}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            onSubmit({ ...values, title, description }, () => {
              setValues(EMPTY);
              setOpen(false);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">{labels.title}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>
          <SegmentedControl
            name={`${id}-kind`}
            label={labels.kind}
            labelHidden
            options={[
              { value: "idea", label: labels.idea, icon: Lightbulb },
              { value: "bug", label: labels.bug, icon: Bug },
            ]}
            value={values.kind}
            onChange={(kind) => set({ kind })}
          />
          <FormField id={`${id}-title`} label={labels.titleField}>
            <Input
              id={`${id}-title`}
              value={values.title}
              onChange={(e) => set({ title: e.target.value })}
              maxLength={maxLength.title}
              required
              autoComplete="off"
            />
          </FormField>
          <FormField id={`${id}-description`} label={labels.descriptionField}>
            <Textarea
              id={`${id}-description`}
              value={values.description}
              onChange={(e) => set({ description: e.target.value })}
              maxLength={maxLength.description}
              required
              // Grows with the text up to a point, then scrolls: the send button stays in view.
              className="max-h-60 min-h-28"
            />
          </FormField>
          <SettingSwitch
            id={`${id}-details`}
            label={labels.details}
            hint={labels.detailsHint}
            checked={values.includeDetails}
            onCheckedChange={(includeDetails) => set({ includeDetails })}
          />
          {/* Out of sight and out of the tab order: only bots fill it in. */}
          <input
            type="text"
            name="website"
            value={values.website}
            onChange={(e) => set({ website: e.target.value })}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="sr-only"
          />
          <DialogFooter>
            <Button type="submit" pending={pending} disabled={!ready}>
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
