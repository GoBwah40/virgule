"use client";

import { cn } from "@/lib/utils";

type Option = {
  value: string;
  /** Short code shown on the button ("EN"). */
  short: string;
  /** Language name in that language ("English"), read by screen readers and shown on hover. */
  name: string;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  labels: { group: string };
  className?: string;
};

/** Language picker as short codes. Real radio buttons: arrow keys, names read out and shown on hover. */
export function LocaleToggle({ value, options, onChange, labels, className }: Props) {
  return (
    <fieldset className={cn("inline-flex rounded-full border bg-card p-0.5", className)}>
      <legend className="sr-only">{labels.group}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          title={option.name}
          lang={option.value}
          className={cn(
            "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full px-2 font-mono text-xs transition-colors",
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            option.value === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name="locale"
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span aria-hidden>{option.short}</span>
          <span className="sr-only">{option.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
