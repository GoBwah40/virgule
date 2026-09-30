"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; icon?: LucideIcon };

type Props<T extends string> = {
  /** Nom du groupe de boutons radio (unique dans la page). */
  name: string;
  /** Libellé du groupe (affiché au-dessus, sauf si `labelHidden`). */
  label: string;
  labelHidden?: boolean;
  /** Explication sous les options (ex. ce qu'implique le choix courant). */
  hint?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Choix d'une option parmi plusieurs, en pastilles. Repose sur de vrais boutons radio :
 * navigation aux flèches et lecture par les lecteurs d'écran fournies par le navigateur.
 */
export function SegmentedControl<T extends string>({
  name,
  label,
  labelHidden,
  hint,
  options,
  value,
  onChange,
  disabled,
  className,
}: Props<T>) {
  return (
    <fieldset className={cn("min-w-0 space-y-2", className)} disabled={disabled}>
      <legend className={labelHidden ? "sr-only" : "mb-2 text-sm font-semibold"}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <label
            key={optionValue}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-semibold transition-colors",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
              optionValue === value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={optionValue === value}
              onChange={() => onChange(optionValue)}
              className="sr-only"
            />
            {Icon && <Icon className="size-4" aria-hidden />}
            {optionLabel}
          </label>
        ))}
      </div>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
