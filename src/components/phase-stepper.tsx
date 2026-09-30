import { cn } from "@/lib/utils";

type Props = {
  steps: { id: string; label: string }[];
  /** Index of the current step; past the last one, all steps are done. */
  current: number;
  /** Items appended at the end of the row (round, status…). */
  extra?: React.ReactNode;
  label: string;
  className?: string;
};

/** Session steps shown as pills. */
export function PhaseStepper({ steps, current, extra, label, className }: Props) {
  return (
    <ol aria-label={label} className={cn("flex flex-wrap items-center gap-1.5 text-sm font-semibold", className)}>
      {steps.map((step, i) => (
        <li
          key={step.id}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "rounded-full px-3 py-1 transition-colors duration-300",
            i === current ? "bg-foreground text-background" : "bg-muted",
            i > current ? "text-muted-foreground" : i < current && "text-foreground",
          )}
        >
          {step.label}
        </li>
      ))}
      {extra}
    </ol>
  );
}
