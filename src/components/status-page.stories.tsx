import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Clock, SearchX } from "lucide-react";

import { StatusPage } from "./status-page";
import { Button } from "./ui/button";

const meta = {
  title: "Composants/StatusPage",
  component: StatusPage,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Séance introuvable",
    body: "Le lien est peut-être incomplet. Demande à la personne qui anime la séance de te le renvoyer.",
    children: <Button>{"Retour à l'accueil"}</Button>,
  },
} satisfies Meta<typeof StatusPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Introuvable: Story = { args: { icon: SearchX } };
export const Expiree: Story = {
  args: {
    icon: Clock,
    title: "Cette séance n'est plus disponible",
    body: "Les séances restent en ligne 7 jours. Crée-en une nouvelle pour reprendre.",
  },
};
