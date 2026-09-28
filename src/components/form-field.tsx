import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint?: string;
  /** Le contrôle (Input, Textarea…) doit porter le même `id`. */
  children: React.ReactNode;
  className?: string;
};

/** Libellé + contrôle + aide, espacés de façon homogène dans tous les formulaires. */
export function FormField({ id, label, hint, children, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
