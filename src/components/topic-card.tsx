import type { LucideIcon } from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string | null;
  /** Badges above the title, with their icon: answer kind ("Period"), vote limit… */
  badges?: { label: string; icon: LucideIcon }[];
  /** Buttons at the bottom of the card (move, edit, delete…). */
  actions?: React.ReactNode;
  className?: string;
};

/** A topic as a card on a board: its badges, its title in large, what it is about, then the actions. */
export function TopicCard({ title, description, badges = [], actions, className }: Props) {
  return (
    <li
      className={cn(
        "flex h-full min-w-0 flex-col gap-2 rounded-xl border-[1.5px] bg-card p-4",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
        className,
      )}
    >
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <IconBadge key={badge.label} icon={badge.icon} label={badge.label} />
          ))}
        </div>
      )}
      {/* Breaks between words only: a narrow column never cuts a title in the middle of one. */}
      <h3 className="font-heading text-xl font-bold wrap-break-word hyphens-auto">{title}</h3>
      {description && <p className="text-sm text-muted-foreground wrap-break-word">{description}</p>}
      {actions && <div className="mt-auto flex flex-wrap justify-end gap-1 pt-2">{actions}</div>}
    </li>
  );
}
