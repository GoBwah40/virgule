import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  /** Text with its figures (e.g. "14 ideas", "3/14 voted"). */
  label: string;
  /** Neutral: a plain count. Progress: something left to do. Complete: done, in green with a check. */
  tone?: "neutral" | "progress" | "complete";
  className?: string;
};

const TONES = {
  neutral: "border-border text-muted-foreground",
  progress: "bg-highlight-soft text-highlight-foreground",
  complete: "border-success/40 bg-success/10 text-success",
} as const;

/** Small count shown next to a title (ideas in a topic, ideas you voted on…). */
export function CountBadge({ label, tone = "neutral", className }: Props) {
  return (
    <Badge variant="outline" className={cn("tabular-nums transition-colors duration-300", TONES[tone], className)}>
      {tone === "complete" && <Check data-icon="inline-start" className="motion-safe:animate-pop" aria-hidden />}
      {label}
    </Badge>
  );
}
