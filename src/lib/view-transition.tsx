import * as React from "react";

/**
 * `ViewTransition` n'existe que dans la version canary de React embarquée par Next
 * (App Router). Ailleurs (tests, Storybook) on rend simplement le contenu.
 */
export const ViewTransition: React.ComponentType<React.ViewTransitionProps> =
  React.ViewTransition ?? (({ children }) => <>{children}</>);
