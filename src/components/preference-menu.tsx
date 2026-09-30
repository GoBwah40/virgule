"use client";

import { ChevronUp, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Language of the label, when it is written in its own language ("Français"). */
  lang?: string;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Name of the setting ("Language"): the trigger is read as "Language, Français". */
  label: string;
  /** Trigger icon; by default, the icon of the current option. */
  icon?: LucideIcon;
  /** Shows the current choice next to the icon; otherwise only screen readers hear it. */
  showValue?: boolean;
  className?: string;
};

/**
 * Discreet footer setting (language, theme): a quiet text button that opens a menu of
 * choices above it, the current one checked.
 */
export function PreferenceMenu({ value, options, onChange, label, icon, showValue = false, className }: Props) {
  const current = options.find((option) => option.value === value) ?? options[0];
  const Icon = icon ?? current.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}, ${current.label}`}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none transition-colors",
          "hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:text-foreground",
          className,
        )}
      >
        {Icon && <Icon className="size-4" aria-hidden />}
        {showValue && <span lang={current.lang}>{current.label}</span>}
        <ChevronUp className="size-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-auto min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(String(next))} aria-label={label}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              lang={option.lang}
              closeOnClick
              className="min-h-11 gap-2.5 px-2.5"
            >
              {option.icon && <option.icon aria-hidden />}
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
