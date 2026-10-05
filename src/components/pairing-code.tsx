import { cn } from "@/lib/utils";

type Props = {
  code: string;
  /** What the code is for, read by screen readers before it (e.g. "Pairing code"). */
  label: string;
  className?: string;
};

/** A short code to type on another device, in large monospace, in two groups to read it out. */
export function PairingCode({ code, label, className }: Props) {
  const half = Math.ceil(code.length / 2);
  return (
    <p className={cn("font-mono text-4xl font-medium tracking-[0.18em] tabular-nums select-all", className)}>
      <span className="sr-only">{label} </span>
      {code.slice(0, half)}
      <span className="ml-[0.45em]">{code.slice(half)}</span>
    </p>
  );
}
