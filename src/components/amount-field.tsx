"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Value = { min: string; max: string };

type Props = {
  /** `single`: one amount; `range`: a range between… and… */
  mode: "single" | "range";
  /** Entered values (raw field text, converted by the caller). */
  value: Value;
  onChange: (value: Value) => void;
  labels: { amount: string; min: string; max: string; currency: string };
  idPrefix: string;
  disabled?: boolean;
  /** Range: why the second amount is refused (shown under the fields, linked to the second one). */
  error?: string;
};

/** Amount in whole euros: numeric keypad on mobile, currency symbol inside the field. */
export function AmountField({ mode, value, onChange, labels, idPrefix, disabled, error }: Props) {
  const errorId = `${idPrefix}-range-error`;
  const invalid = mode === "range" && Boolean(error);
  const field = (key: keyof Value, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${key}`} className="text-sm font-semibold">
        {label}
        {/* The unit is visible in the field; screen readers hear it in the label. */}
        <span className="sr-only"> ({labels.currency})</span>
      </Label>
      <div className="relative">
        <Input
          id={`${idPrefix}-${key}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value[key]}
          disabled={disabled}
          aria-invalid={invalid && key === "max" ? true : undefined}
          aria-describedby={invalid && key === "max" ? errorId : undefined}
          // Digits only: no decimals, no sign.
          onChange={(e) => onChange({ ...value, [key]: e.target.value.replace(/\D/g, "").slice(0, 8) })}
          className="pr-9 tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted-foreground" aria-hidden>
          {labels.currency}
        </span>
      </div>
    </div>
  );

  if (mode === "single") return field("min", labels.amount);
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        {field("min", labels.min)}
        {field("max", labels.max)}
      </div>
      {invalid && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
