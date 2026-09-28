"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** Réglage on/off avec libellé et explication. */
export function SettingSwitch({ id, label, hint, checked, onCheckedChange, disabled }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="mt-0.5" />
    </div>
  );
}
