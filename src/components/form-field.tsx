import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint?: string;
  /** The control (Input, Textarea…) must carry the same `id`. */
  children: React.ReactNode;
  /** Shown on the control's row (e.g. a submit button), above the hint. */
  action?: React.ReactNode;
  className?: string;
};

/** Label + control + hint, spaced consistently across all forms. */
export function FormField({ id, label, hint, children, action, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {action ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{children}</div>
          {action}
        </div>
      ) : (
        children
      )}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
