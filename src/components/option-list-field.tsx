"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  /** Préfixe des `id` (unique dans la page). */
  idPrefix: string;
  value: string[];
  onChange: (value: string[]) => void;
  labels: { label: string; hint: string; placeholder: string; add: string; remove: (option: string) => string };
  max: number;
  maxLength: number;
  disabled?: boolean;
};

const key = (s: string) => s.trim().toLowerCase();

/**
 * Liste d'options saisies une à une : pastilles retirables et champ d'ajout (Entrée pour
 * ajouter). Les doublons évidents (même texte, casse comprise) sont ignorés à la saisie ;
 * le serveur fait la vérification complète.
 */
export function OptionListField({ idPrefix, value, onChange, labels, max, maxLength, disabled }: Props) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;
  const canAdd = !disabled && !full && draft.trim() !== "" && !value.some((o) => key(o) === key(draft));

  const add = () => {
    if (!canAdd) return;
    onChange([...value, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-option`} className="text-sm font-semibold">
        {labels.label}
      </Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((option) => (
            <li
              key={option}
              className="inline-flex h-10 items-center gap-1 rounded-full bg-muted pr-1 pl-3.5 text-sm font-semibold motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
            >
              {option}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label={labels.remove(option)}
                disabled={disabled}
                onClick={() => onChange(value.filter((o) => o !== option))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-option`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Entrée ajoute l'option au lieu d'envoyer tout le formulaire.
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={labels.placeholder}
          maxLength={maxLength}
          disabled={disabled || full}
        />
        <Button type="button" variant="outline" disabled={!canAdd} onClick={add}>
          <Plus data-icon="inline-start" />
          {labels.add}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{labels.hint}</p>
    </div>
  );
}
