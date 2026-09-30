"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RELEASE_CATEGORIES, type ReleaseCategory } from "@/lib/release-notes";
import { cn } from "@/lib/utils";

export type ReleaseNotesEntry = {
  version: string;
  /** Date déjà mise en forme (« 30 septembre 2026 »). */
  date: string;
  changes: Record<ReleaseCategory, string[]>;
};

type Props = {
  /** Version en ligne, affichée sur le bouton. */
  version: string;
  /** De la plus récente à la plus ancienne. */
  releases: ReleaseNotesEntry[];
  /** Pastille papaye tant que la personne n'a pas ouvert les notes de cette version. */
  unread?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels: {
    trigger: string;
    unread: string;
    title: string;
    description: string;
    close: string;
    latest: string;
    categories: Record<ReleaseCategory, string>;
  };
  className?: string;
};

const CATEGORY_MARK: Record<ReleaseCategory, string> = {
  added: "bg-brand",
  improved: "bg-highlight",
  fixed: "bg-success",
};

/** Bouton discret « v0.4.0 Nouveautés » qui ouvre, depuis le bas de l'écran, les notes de chaque version. */
export function ReleaseNotesSheet({ version, releases, unread = false, onOpenChange, labels, className }: Props) {
  return (
    <Sheet onOpenChange={(open) => onOpenChange?.(open)}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            className={cn("rounded-full px-3 text-sm font-medium text-muted-foreground", className)}
          />
        }
      >
        {unread && (
          <>
            <span className="size-2 rounded-full bg-brand" aria-hidden />
            <span className="sr-only">{labels.unread}</span>
          </>
        )}
        <span className="font-mono text-xs">v{version}</span>
        {labels.trigger}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[85dvh] w-full max-w-lg gap-0 rounded-t-3xl border-x pb-[env(safe-area-inset-bottom)] motion-reduce:transition-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-4 border-b px-5 pt-3 pb-4">
          <div className="space-y-1">
            <SheetTitle className="text-2xl font-extrabold">{labels.title}</SheetTitle>
            <SheetDescription>{labels.description}</SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="icon" className="-mr-2 rounded-full" />}>
            <XIcon aria-hidden />
            <span className="sr-only">{labels.close}</span>
          </SheetClose>
        </div>
        <div className="divide-y divide-dashed overflow-y-auto px-5">
          {releases.map((release, index) => (
            <section key={release.version} className="space-y-4 py-5" aria-labelledby={`release-${release.version}`}>
              <h2 id={`release-${release.version}`} className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm">v{release.version}</span>
                <span className="text-sm font-normal text-muted-foreground">{release.date}</span>
                {index === 0 && (
                  <span className="rounded-md bg-highlight-soft px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
                    {labels.latest}
                  </span>
                )}
              </h2>
              {RELEASE_CATEGORIES.filter((category) => release.changes[category].length > 0).map((category) => (
                <div key={category} className="space-y-1.5">
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                    <span className={cn("size-2.5 rounded-xs", CATEGORY_MARK[category])} aria-hidden />
                    {labels.categories[category]}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-[15px] marker:text-muted-foreground">
                    {release.changes[category].map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
