"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Value = { min: string; max: string };

type Props = {
  /** `single` : un montant ; `range` : une fourchette entre… et… */
  mode: "single" | "range";
  /** Valeurs saisies (texte brut des champs, converti par l'appelant). */
  value: Value;
  onChange: (value: Value) => void;
  labels: { amount: string; min: string; max: string; currency: string };
  idPrefix: string;
  disabled?: boolean;
};

/** Montant en euros entiers : clavier numérique sur mobile, symbole de la devise dans le champ. */
export function AmountField({ mode, value, onChange, labels, idPrefix, disabled }: Props) {
  const field = (key: keyof Value, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${key}`} className="text-sm font-semibold">
        {label}
        {/* L'unité est visible dans le champ ; les lecteurs d'écran l'entendent dans le libellé. */}
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
          // Chiffres uniquement : pas de décimales, pas de signe.
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
    <div className="grid grid-cols-2 gap-2">
      {field("min", labels.min)}
      {field("max", labels.max)}
    </div>
  );
}
