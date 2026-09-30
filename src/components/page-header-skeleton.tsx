import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Number of action buttons to mimic (like PageHeader's actions). */
  actions?: number;
};

/** PageHeader skeleton: same margins and proportions as the real title. */
export function PageHeaderSkeleton({ actions = 0 }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="w-full max-w-2xl space-y-2.5">
        <Skeleton className="h-8 w-3/5 max-w-sm" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-4/5 max-w-md" />
      </div>
      {actions > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg sm:w-36" />
          ))}
        </div>
      )}
    </div>
  );
}
