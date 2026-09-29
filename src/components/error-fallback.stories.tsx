import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ErrorFallback } from "./error-fallback";

const meta = {
  title: "Composants/ErrorFallback",
  component: ErrorFallback,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Quelque chose n'a pas marché",
    body: "La page n'a pas pu s'afficher. Réessaie : le plus souvent, ça suffit.",
    labels: { retry: "Réessayer", home: "Retour à l'accueil" },
    onRetry: fn(),
    details: "Code d'erreur : 3187542011",
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PleinePage: Story = {};
export const DansUneSeance: Story = {
  args: {
    size: "section",
    title: "Cette étape n'a pas pu s'afficher",
    body: "Les idées déjà proposées et les votes déjà faits sont enregistrés. Réessaie dans un instant.",
  },
};
