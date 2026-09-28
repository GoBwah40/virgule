import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Badges ou informations sous le contenu. */
  meta?: React.ReactNode;
  /** Actions à droite (votes, statut…). */
  actions?: React.ReactNode;
  /** Teinte de fond : positive (vert), negative (rouge), neutral (sable) ou plain (carte). */
  tone?: "plain" | "neutral" | "positive" | "negative";
  className?: string;
};

const TONES = {
  plain: "border-border bg-card",
  neutral: "border-transparent bg-muted",
  positive: "border-success/35 bg-success/10",
  negative: "border-destructive/35 bg-destructive/10",
} as const;

/** Ligne de liste (idée, sujet…) : contenu, métadonnées et actions, empilés sur mobile. */
export function ListItem({ children, meta, actions, tone = "neutral", className }: Props) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        TONES[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-[15px] font-medium break-words whitespace-pre-wrap">{children}</div>
        {meta && <div className="flex flex-wrap items-center gap-1.5">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">{actions}</div>}
    </li>
  );
}
