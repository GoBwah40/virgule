import { ViewTransition } from "@/lib/view-transition";

type Props = {
  /** Announced to screen readers (e.g. "Loading the session…"). */
  label: string;
  children: React.ReactNode;
};

/**
 * Wrapper for loading screens: announces loading to screen readers and fades out
 * quickly when the real content arrives (which enters with PhaseTransition).
 */
export function LoadingState({ label, children }: Props) {
  return (
    <ViewTransition exit="loading-exit" default="none">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{label}</span>
        <div aria-hidden>{children}</div>
      </div>
    </ViewTransition>
  );
}
