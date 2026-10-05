"use client";

import { Columns3, LayoutList } from "lucide-react";

import { SegmentedControl } from "@/components/segmented-control";
import type { ViewPreference } from "@/lib/view-preference";
import { cn } from "@/lib/utils";

type Props = {
  value: ViewPreference;
  onChange: (value: ViewPreference) => void;
  /** Already translated: the group name (read by screen readers) and each layout. */
  labels: { label: string; list: string; board: string };
  className?: string;
};

/**
 * List or board, at the top right of a step. Only from tablets up: phones have room for one
 * column, the list.
 */
export function ViewSwitch({ value, onChange, labels, className }: Props) {
  return (
    <SegmentedControl
      className={cn("hidden justify-items-end md:grid print:hidden", className)}
      name="view"
      label={labels.label}
      labelHidden
      options={[
        { value: "list", label: labels.list, icon: LayoutList },
        { value: "board", label: labels.board, icon: Columns3 },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
