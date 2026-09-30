import { cn } from "@/lib/utils";

/** Tracé de la virgule (grille 64) : une tête ronde de rayon 14 posée sur la ligne de base,
    prolongée d'une queue qui s'effile vers la gauche. Partagé avec la rosace et les icônes. */
export const COMMA_PATH = "M46 28C46 44 37 54 21 59L19 54C25 51 28.5 47 29.6 41.8A14 14 0 1 1 46 28Z";

type Props = {
  /** Nom de l'app, affiché en minuscules et lu tel quel par les lecteurs d'écran. */
  label: string;
  /** `wordmark` : le mot suivi de la virgule ; `mark` : la virgule seule. */
  variant?: "wordmark" | "mark";
  className?: string;
};

/** Logo Virgule : le mot en Bricolage extra-gras, fermé par une virgule papaye. La taille suit `font-size`. */
export function Logo({ label, variant = "wordmark", className }: Props) {
  const comma = (
    <svg viewBox="18 12 30 48" className="h-[0.72em] w-[0.45em] shrink-0 translate-y-[0.26em] fill-brand" aria-hidden>
      <path d={COMMA_PATH} />
    </svg>
  );
  if (variant === "mark") {
    return (
      <span role="img" aria-label={label} className={cn("inline-flex", className)}>
        {comma}
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex items-baseline font-heading leading-none font-extrabold tracking-[-0.035em] whitespace-nowrap lowercase",
        className,
      )}
    >
      <span aria-hidden>{label}</span>
      {comma}
    </span>
  );
}
