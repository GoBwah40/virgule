import { ListItemSkeleton } from "@/components/list-item-skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Nombre de lignes simulées dans la carte. */
  rows?: number;
  /** Actions des lignes (voir ListItemSkeleton). */
  rowActions?: React.ComponentProps<typeof ListItemSkeleton>["actions"];
  /** Simule le champ d'ajout en bas de carte (page des idées). */
  withComposer?: boolean;
};

const ROW_WIDTHS = ["long", "medium", "short"] as const;

/** Squelette d'une carte de sujet : titre, description, lignes et, au besoin, champ d'ajout. */
export function CardSkeleton({ rows = 2, rowActions = "none", withComposer }: Props) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      {rows > 0 && (
        <CardContent>
          <ul className="space-y-2">
            {Array.from({ length: rows }, (_, i) => (
              <ListItemSkeleton key={i} actions={rowActions} width={ROW_WIDTHS[i % ROW_WIDTHS.length]} />
            ))}
          </ul>
        </CardContent>
      )}
      {withComposer && (
        <CardFooter className="gap-2 border-t bg-muted/50 py-3">
          <Skeleton className="h-11 flex-1 rounded-lg bg-card" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </CardFooter>
      )}
    </Card>
  );
}
