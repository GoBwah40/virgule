import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  status: "retained" | "rejected";
  label: string;
  /** Détail affiché au survol, au focus ou au tap (ex. le score). */
  tooltip?: string;
  className?: string;
};

/** Statut d'une idée au bilan : vert plein si retenue, contour rouge si écartée. */
export function StatusBadge({ status, label, tooltip, className }: Props) {
  const badge = (
    <Badge
      variant={status === "retained" ? "default" : "outline"}
      className={cn(
        status === "retained"
          ? "bg-success text-success-foreground"
          : "border-[1.5px] border-destructive/50 text-destructive",
        className,
      )}
    >
      {status === "retained" ? <Check data-icon="inline-start" /> : <X data-icon="inline-start" />}
      {label}
    </Badge>
  );

  if (!tooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} aria-label={`${label} · ${tooltip}`} />}
        className="inline-flex shrink-0 cursor-default rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
