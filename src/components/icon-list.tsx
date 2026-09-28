import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  items: { icon: LucideIcon; text: string }[];
  className?: string;
};

/** Liste d'étapes ou d'arguments, chaque ligne précédée d'une icône en pastille mangue. */
export function IconList({ items, className }: Props) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-highlight-soft text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="pt-1.5">{text}</span>
        </li>
      ))}
    </ul>
  );
}
