import { ViewTransition } from "@/lib/view-transition";

type Props = { children: React.ReactNode; className?: string };

/**
 * Enter / exit transition for a session step (Topics → Ideas → Recap).
 * Place it in each page, not in the layout: the layout persists across navigations,
 * so its enter and exit transitions would never fire.
 * Refreshes (polling, Pusher) don't remount the page: no animation.
 * Styles: `::view-transition-*(.phase-enter|.phase-exit)` in globals.css.
 */
export function PhaseTransition({ children, className }: Props) {
  return (
    <ViewTransition enter="phase-enter" exit="phase-exit" default="none">
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
