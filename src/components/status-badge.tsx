import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  status: "retained" | "rejected";
  label: string;
  className?: string;
};

/** Status of an idea in the recap: solid green if kept, red outline if dropped. */
export function StatusBadge({ status, label, className }: Props) {
  return (
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
}
