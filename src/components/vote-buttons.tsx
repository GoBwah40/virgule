"use client";

import { ArrowDown, ArrowUp, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** true = for, false = against, null = no vote. */
  value: boolean | null;
  /** Receives the new value; clicking the active vote again removes it (null). */
  onChange: (next: boolean | null) => void;
  /** `down` is not used in "pick" mode. */
  labels: { up: string; down?: string };
  /**
   * "upDown": for / against. "pick": a single ✓ button, to pick one option among
   * several (single-answer list); the value is then true or null.
   */
  mode?: "upDown" | "pick";
  /** If set, the buttons are disabled and this text explains why. */
  disabledReason?: string;
  /**
   * If set, only "for" is disabled, with this text as the reason (e.g. no "for" votes left).
   * An active "for" stays clickable, so the vote can still be removed.
   */
  upDisabledReason?: string;
  className?: string;
};

// The `dark:` variants are needed: the `outline` button forces its own background in dark mode.
const UP_PRESSED =
  "border-success bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground dark:border-success dark:bg-success dark:hover:bg-success/90";

/** Pair of ↑ / ↓ buttons (44 px), or a single ✓ in "pick" mode; the label is in the tooltip and the aria-label. */
export function VoteButtons({
  value,
  onChange,
  labels,
  mode = "upDown",
  disabledReason,
  upDisabledReason,
  className,
}: Props) {
  const disabled = !!disabledReason;
  const upBlocked = !disabled && !!upDisabledReason && value !== true;
  const buttons = (
    <div className={cn("flex shrink-0 gap-1.5", className)}>
      <VoteButton
        label={labels.up}
        pressed={value === true}
        disabled={disabled || upBlocked}
        disabledReason={upBlocked ? upDisabledReason : undefined}
        onClick={() => onChange(value === true ? null : true)}
        pressedClassName={UP_PRESSED}
      >
        {mode === "pick" ? <Check /> : <ArrowUp />}
      </VoteButton>
      {mode === "upDown" && (
        <VoteButton
          label={labels.down ?? ""}
          pressed={value === false}
          disabled={disabled}
          onClick={() => onChange(value === false ? null : false)}
          pressedClassName="border-destructive bg-destructive text-white hover:bg-destructive/90 hover:text-white dark:border-destructive dark:bg-destructive dark:text-background dark:hover:bg-destructive/90 dark:hover:text-background"
        >
          <ArrowDown />
        </VoteButton>
      )}
    </div>
  );

  if (!disabled) return buttons;
  // A disabled button doesn't trigger a tooltip: the group explains why instead.
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />}>{buttons}</TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function VoteButton({
  label,
  pressed,
  disabled,
  onClick,
  pressedClassName,
  disabledReason,
  children,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  /** Reason shown on this button alone while it is disabled. */
  disabledReason?: string;
  onClick: () => void;
  pressedClassName: string;
  children: React.ReactNode;
}) {
  const button = (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border-[1.5px] active:scale-95 [&_svg:not([class*='size-'])]:size-5",
        pressed && pressedClassName,
        // Bounce when the vote becomes active; nothing when it's removed.
        pressed && "motion-safe:animate-pop",
      )}
    >
      {children}
    </Button>
  );
  if (disabled && disabledReason) {
    // A disabled button doesn't trigger a tooltip: a focusable wrapper explains why.
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
