import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = { icon: LucideIcon; label: string; className?: string };

/** Discreet badge with an icon (e.g. a topic's answer type: "Period", "Range"). */
export function IconBadge({ icon: Icon, label, className }: Props) {
  return (
    <Badge variant="outline" className={cn("gap-1 text-muted-foreground", className)}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  );
}
