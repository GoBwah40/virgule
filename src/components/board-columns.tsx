import { cn } from "@/lib/utils";

type Props = {
  /** One block per column, each with its `key` (`<li>` items when rendered as a list). */
  children: React.ReactNode;
  /** `ul`: the blocks are list items (topic cards…). */
  as?: "div" | "ul";
  className?: string;
};

/**
 * A board: equal columns side by side, as many as fit (16 rem at least), each block stretched to
 * the height of its row. One column on phones.
 */
export function BoardColumns({ children, as: Tag = "div", className }: Props) {
  return <Tag className={cn("grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]", className)}>{children}</Tag>;
}
