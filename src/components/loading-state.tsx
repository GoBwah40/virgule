import { Rosette } from "@/components/rosette";
import { ViewTransition } from "@/lib/view-transition";

type Props = {
  /** Announced to screen readers (e.g. "Loading the session…"). */
  label: string;
  children: React.ReactNode;
};

/**
 * Wrapper for loading screens: announces loading to screen readers, shows the turning rosette on a
 * dark veil in the middle of the screen if it lasts, and fades out quickly when the real content arrives (which
 * enters with PhaseTransition).
 */
export function LoadingState({ label, children }: Props) {
  return (
    <ViewTransition exit="loading-exit" default="none">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{label}</span>
        <div aria-hidden>
          {children}
          {/* If it lasts: a dark veil over the whole screen, the rosette turning in the middle. */}
          <div className="loading-veil pointer-events-none fixed inset-0 z-50 grid place-items-center bg-scrim supports-backdrop-filter:backdrop-blur-xs">
            <Rosette className="size-24 motion-safe:animate-rosette-turn" />
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
