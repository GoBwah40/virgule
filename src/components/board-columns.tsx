import { cn } from "@/lib/utils";

type Props = {
  /** One block per column, each with its `key`. */
  children: React.ReactNode;
  className?: string;
};

/**
 * A board: equal columns side by side, as many as fit (16 rem at least), each block stretched to
 * the height of its row. One column on phones.
 */
export function BoardColumns({ children, className }: Props) {
  return <div className={cn("grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]", className)}>{children}</div>;
}
