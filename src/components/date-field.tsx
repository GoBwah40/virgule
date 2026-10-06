"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Value = { start: string; end: string };

type Props = {
  /** `single`: one date; `range`: a period from… to… */
  mode: "single" | "range";
  value: Value;
  onChange: (value: Value) => void;
  labels: { date: string; from: string; to: string };
  /** Prefix for the field `id`s (unique in the page). */
  idPrefix: string;
  disabled?: boolean;
  /** Period: why the end date is refused (shown under the fields, linked to the end date). */
  error?: string;
};

/**
 * Date or period input using the phone's native picker.
 * Values are "YYYY-MM-DD". In a period, the end cannot come before the start.
 */
export function DateField({ mode, value, onChange, labels, idPrefix, disabled, error }: Props) {
  if (mode === "single") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-start`} className="text-sm font-semibold">
          {labels.date}
        </Label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          value={value.start}
          disabled={disabled}
          onChange={(e) => onChange({ start: e.target.value, end: e.target.value })}
        />
      </div>
    );
  }

  const errorId = `${idPrefix}-range-error`;
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-start`} className="text-sm font-semibold">
            {labels.from}
          </Label>
          <Input
            id={`${idPrefix}-start`}
            type="date"
            value={value.start}
            max={value.end || undefined}
            disabled={disabled}
            // If the new start date passes the end, the end follows it.
            onChange={(e) => {
              const start = e.target.value;
              onChange({ start, end: value.end && value.end < start ? start : value.end });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-end`} className="text-sm font-semibold">
            {labels.to}
          </Label>
          <Input
            id={`${idPrefix}-end`}
            type="date"
            value={value.end}
            min={value.start || undefined}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange({ start: value.start, end: e.target.value })}
          />
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
