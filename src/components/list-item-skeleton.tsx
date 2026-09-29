import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  /** Ce qui s'affiche à droite de la ligne : boutons de vote, statut ou rien. */
  actions?: "votes" | "status" | "none";
  /** Ajoute une ligne de badges sous le texte. */
  withMeta?: boolean;
  /** Largeur du texte, pour varier les lignes d'une même liste. */
  width?: "short" | "medium" | "long";
};

const WIDTHS = { short: "w-2/5", medium: "w-3/5", long: "w-4/5" } as const;

/** Squelette de ListItem : même hauteur, mêmes coins, même empilement sur mobile. */
export function ListItemSkeleton({ actions = "none", withMeta, width = "medium" }: Props) {
  return (
    <li className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-transparent bg-muted/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className={cn("h-4 bg-foreground/10", WIDTHS[width])} />
        {withMeta && <Skeleton className="h-5 w-20 rounded-full bg-foreground/10" />}
      </div>
      {actions === "votes" && (
        <div className="flex gap-1.5 self-end sm:self-center">
          <Skeleton className="size-11 rounded-lg bg-foreground/10" />
          <Skeleton className="size-11 rounded-lg bg-foreground/10" />
        </div>
      )}
      {actions === "status" && <Skeleton className="h-6 w-20 self-end rounded-full bg-foreground/10 sm:self-center" />}
    </li>
  );
}
