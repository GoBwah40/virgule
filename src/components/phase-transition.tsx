import * as React from "react";

type Props = { children: React.ReactNode; className?: string };

// `ViewTransition` n'existe que dans la version canary de React embarquée par Next
// (App Router). Ailleurs (tests, Storybook) on rend simplement le contenu.
const ViewTransition: React.ComponentType<React.ViewTransitionProps> =
  React.ViewTransition ?? (({ children }) => <>{children}</>);

/**
 * Transition d'entrée / de sortie d'une étape de la séance (Sujets → Idées → Bilan).
 * À placer dans chaque page, pas dans le layout : le layout persiste entre les
 * navigations, ses transitions d'entrée et de sortie ne se déclencheraient jamais.
 * Les rafraîchissements (polling, Pusher) ne remontent pas la page : aucune animation.
 * Styles : `::view-transition-*(.phase-enter|.phase-exit)` dans globals.css.
 */
export function PhaseTransition({ children, className }: Props) {
  return (
    <ViewTransition enter="phase-enter" exit="phase-exit" default="none">
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
