import { cn } from "@/lib/utils";

type Props = {
  steps: { id: string; label: string }[];
  /** Index de l'étape en cours ; au-delà de la dernière, toutes sont terminées. */
  current: number;
  /** Éléments ajoutés en fin de ligne (tour, statut…). */
  extra?: React.ReactNode;
  label: string;
  className?: string;
};

/** Étapes de la séance sous forme de pilules. */
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
