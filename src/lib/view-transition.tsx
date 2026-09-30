import * as React from "react";

/**
 * `ViewTransition` only exists in the canary React build bundled by Next (App Router).
 * Elsewhere (tests, Storybook) the content is simply rendered.
 */
export const ViewTransition: React.ComponentType<React.ViewTransitionProps> =
  React.ViewTransition ?? (({ children }) => <>{children}</>);
