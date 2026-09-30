"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Preference = "system" | "light" | "dark";

const ICONS: Record<Preference, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };
const ORDER: Preference[] = ["system", "light", "dark"];

type Props = {
  value: Preference;
  onChange: (value: Preference) => void;
  labels: { group: string } & Record<Preference, string>;
  className?: string;
};

/**
 * Choix du thème en trois icônes (système, clair, sombre). Vrais boutons radio :
 * navigation aux flèches, libellés lus par les lecteurs d'écran et affichés au survol.
 */
export function ThemeToggle({ value, onChange, labels, className }: Props) {
  return (
    <fieldset className={cn("inline-flex rounded-full border bg-card p-0.5", className)}>
      <legend className="sr-only">{labels.group}</legend>
      {ORDER.map((option) => {
        const Icon = ICONS[option];
        return (
          <label
            key={option}
            title={labels[option]}
            className={cn(
              "inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              option === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={option === value}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <Icon className="size-4" aria-hidden />
            <span className="sr-only">{labels[option]}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
