import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  up: number;
  down: number;
  /** Libellés déjà formatés (ex. « 4 pour », « 1 contre »). */
  labels: { up: string; down: string };
  className?: string;
};

/** Détail d'un vote : « pour » à gauche, « contre » à droite, au-dessus d'une barre proportionnelle. */
export function VoteSummary({ up, down, labels, className }: Props) {
  const total = up + down;
  const upShare = total === 0 ? 0 : (up / total) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Chaque libellé est au-dessus de sa couleur dans la barre : pour à gauche, contre à droite. */}
      <div className="flex items-center justify-between gap-4 text-sm font-semibold tabular-nums">
        <span className="inline-flex items-center gap-1 text-success">
          <ArrowUp className="size-4" aria-hidden />
          {labels.up}
        </span>
        <span className="inline-flex items-center gap-1 text-destructive">
          <ArrowDown className="size-4" aria-hidden />
          {labels.down}
        </span>
      </div>
      {/* Barre décorative : l'information est déjà donnée par le texte ci-dessus. */}
      <div className="flex h-2 overflow-hidden rounded-full bg-border" aria-hidden>
        {total > 0 && (
          <>
            <span className="bg-success transition-[width] duration-300" style={{ width: `${upShare}%` }} />
            <span className="bg-destructive transition-[width] duration-300" style={{ width: `${100 - upShare}%` }} />
          </>
        )}
      </div>
    </div>
  );
}
