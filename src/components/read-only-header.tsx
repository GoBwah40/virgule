import { Eye } from "lucide-react";

import { Logo } from "@/components/logo";

type Props = {
  /** Name of the app, for the logo (back to the home page). */
  logoLabel: string;
  title: string;
  /** Who shared it, until when it stays online… */
  subtitle: string;
  /** What the person can (not) do here, e.g. "Read-only". */
  note: string;
};

/** Header of a page shown to someone outside the session: no seats, no steps, nothing to tap. */
export function ReadOnlyHeader({ logoLabel, title, subtitle, note }: Props) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto w-full max-w-5xl space-y-1 px-4 py-4">
        <Logo label={logoLabel} href="/" className="text-lg" />
        <h1 className="font-heading text-2xl leading-tight font-extrabold wrap-break-word">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Eye className="size-4" aria-hidden />
          {note}
        </p>
      </div>
    </header>
  );
}
