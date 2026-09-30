"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** true = pour, false = contre, null = pas de vote. */
  value: boolean | null;
  /** Reçoit la nouvelle valeur ; re-cliquer sur le vote actif le retire (null). */
  onChange: (next: boolean | null) => void;
  labels: { up: string; down: string };
  /** Si renseigné, les boutons sont désactivés et ce texte explique pourquoi. */
  disabledReason?: string;
  className?: string;
};

/** Paire de boutons ↑ / ↓ (44 px) ; le libellé est dans l'infobulle et l'aria-label. */
export function VoteButtons({ value, onChange, labels, disabledReason, className }: Props) {
  const disabled = !!disabledReason;
  const buttons = (
    <div className={cn("flex shrink-0 gap-1.5", className)}>
      <VoteButton
        label={labels.up}
        pressed={value === true}
        disabled={disabled}
        onClick={() => onChange(value === true ? null : true)}
        // Les variantes `dark:` sont nécessaires : le bouton `outline` impose son propre fond en mode sombre.
        pressedClassName="border-success bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground dark:border-success dark:bg-success dark:hover:bg-success/90"
      >
        <ArrowUp />
      </VoteButton>
      <VoteButton
        label={labels.down}
        pressed={value === false}
        disabled={disabled}
        onClick={() => onChange(value === false ? null : false)}
        pressedClassName="border-destructive bg-destructive text-white hover:bg-destructive/90 hover:text-white dark:border-destructive dark:bg-destructive dark:text-background dark:hover:bg-destructive/90 dark:hover:text-background"
      >
        <ArrowDown />
      </VoteButton>
    </div>
  );

  if (!disabled) return buttons;
  // Un bouton désactivé ne déclenche pas d'infobulle : c'est le groupe qui explique pourquoi.
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
  children,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
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
        // Rebond quand le vote passe à « actif » ; rien quand on le retire.
        pressed && "motion-safe:animate-pop",
      )}
    >
      {children}
    </Button>
  );
  if (disabled) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
