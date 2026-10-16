import { COMMA_PATH } from "@/components/logo";
import { cn } from "@/lib/utils";

// One comma per brand color, like the rosette (never the vote colors).
const FILLS = ["fill-brand", "fill-highlight", "fill-primary"] as const;

type Props = {
  /** `brand`: one comma per brand color; `current`: all in the text color (inside a button). */
  tone?: "brand" | "current";
  className?: string;
};

/**
 * Loading animation for a button whose action is running: three commas rising one after the
 * other, an ellipsis written in commas. Decorative: the button keeps its label as its name.
 * Size follows `font-size`; still when the user reduces motion.
 */
export function LoadingMark({ tone = "brand", className }: Props) {
  return (
    <span aria-hidden data-slot="loading-mark" className={cn("inline-flex items-end gap-[0.14em]", className)}>
      {FILLS.map((fill, i) => (
        <svg
          key={fill}
          viewBox="18 12 30 48"
          className={cn("shrink-0 motion-safe:animate-comma-wave", tone === "brand" ? fill : "fill-current")}
          // Inline size: a button sizes the icons it contains, not these commas.
          style={{ width: "0.45em", height: "0.72em", animationDelay: `${i * 140}ms` }}
        >
          <path d={COMMA_PATH} />
        </svg>
      ))}
    </span>
  );
}
