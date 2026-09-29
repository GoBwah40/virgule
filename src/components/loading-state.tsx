import { ViewTransition } from "@/lib/view-transition";

type Props = {
  /** Annoncé aux lecteurs d'écran (ex. « Chargement de la séance… »). */
  label: string;
  children: React.ReactNode;
};

/**
 * Conteneur des écrans de chargement : annonce le chargement aux lecteurs d'écran,
 * et sort en fondu rapide quand le vrai contenu arrive (qui entre avec PhaseTransition).
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
