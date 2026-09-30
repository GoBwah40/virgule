import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = { icon: LucideIcon; label: string; className?: string };

/** Badge discret avec icône (ex. type de réponse d'un sujet : « Période », « Fourchette »). */
export function IconBadge({ icon: Icon, label, className }: Props) {
  return (
    <Badge variant="outline" className={cn("gap-1 text-muted-foreground", className)}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  );
}
