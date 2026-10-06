"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** Points given to the idea (0 = none). */
  value: number;
  /** Most points the idea can get: its own points plus those left in the topic. */
  max: number;
  /** Receives the new number of points, one more or one less. */
  onChange: (next: number) => void;
  /**
   * `value`: the count, already formatted (e.g. "2 points"), read with the buttons and
   * announced when it changes; `group`: names the stepper (e.g. "Your points for this idea").
   */
  labels: { decrease: string; increase: string; value: string; group: string };
  /** If set, both buttons are disabled and this text explains why. */
  disabledReason?: string;
  /** Shown on "+" alone once no point is left (it stays focusable to tell why). */
  increaseDisabledReason?: string;
  className?: string;
};

// The `dark:` variants are needed: the `outline` button forces its own background in dark mode.
const GIVEN = "border-success bg-success/10 text-success dark:border-success dark:bg-success/10";

/** − / count / + for a points vote: compact, with 44 px buttons. */
export function PointsStepper({ value, max, onChange, labels, disabledReason, increaseDisabledReason, className }: Props) {
  const disabled = !!disabledReason;
  const atMax = value >= max;
  const stepper = (
    <div role="group" aria-label={labels.group} className={cn("flex shrink-0 items-center gap-1", className)}>
      <StepButton label={labels.decrease} disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}>
        <Minus />
      </StepButton>
      <output
        aria-live="polite"
        aria-label={labels.value}
        className={cn(
          "inline-flex h-11 min-w-9 items-center justify-center rounded-md border-[1.5px] px-1 font-heading text-lg font-bold tabular-nums",
          value > 0 ? GIVEN : "border-transparent text-muted-foreground",
        )}
      >
        {/* Bounces when the count changes; nothing when it is reduced motion. */}
        <span key={value} className="motion-safe:animate-pop">
          {value}
        </span>
      </output>
      <StepButton
        label={labels.increase}
        disabled={disabled || atMax}
        disabledReason={!disabled && atMax ? increaseDisabledReason : undefined}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </StepButton>
    </div>
  );

  if (!disabled) return stepper;
  // A disabled button doesn't trigger a tooltip: the group explains why instead.
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} aria-label={disabledReason} />}>{stepper}</TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function StepButton({
  label,
  disabled,
  disabledReason,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const button = (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-[1.5px] motion-safe:active:scale-95 [&_svg:not([class*='size-'])]:size-5"
    >
      {children}
    </Button>
  );
  if (disabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} aria-label={disabledReason} className="rounded-md" />}>{button}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }
  if (disabled) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
