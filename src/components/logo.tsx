import { cn } from "@/lib/utils";

/** Comma path (64 grid): a round head of radius 14 sitting on the baseline,
    extended by a tail tapering to the left. Shared with the rosette and the icons. */
export const COMMA_PATH = "M46 28C46 44 37 54 21 59L19 54C25 51 28.5 47 29.6 41.8A14 14 0 1 1 46 28Z";

type Props = {
  /** App name, shown in lowercase and read as-is by screen readers. */
  label: string;
  /** `wordmark`: the word followed by the comma; `mark`: the comma alone. */
  variant?: "wordmark" | "mark";
  className?: string;
};

/** Virgule logo: the word in extra-bold Bricolage, closed by a papaya comma. Size follows `font-size`. */
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
