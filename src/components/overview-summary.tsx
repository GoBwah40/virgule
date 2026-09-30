import { cn } from "@/lib/utils";

type Props = {
  /** Phrase principale (« Créneau commun : du 12 au 14 juin 2027 »). */
  summary: string;
  /** Précision (« Commun aux 3 périodes retenues. »). */
  detail: string;
  /** Vrai si la zone est commune à toutes les propositions retenues. */
  common: boolean;
  className?: string;
};

/** Encadré de synthèse du bilan : vert si tout le monde se recoupe, mangue sinon. */
export function OverviewSummary({ summary, detail, common, className }: Props) {
  return (
    <div
      className={cn(
        "grid gap-0.5 rounded-2xl border-[1.5px] px-3.5 py-3",
        common ? "border-success/40 bg-success/10" : "border-highlight/60 bg-highlight-soft",
        className,
      )}
    >
      <p className="font-semibold">{summary}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
