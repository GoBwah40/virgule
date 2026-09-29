import type { Phase } from "@/generated/prisma/enums";

/** Page correspondant à une étape de la séance (utilisable côté serveur et client). */
export const phasePath = (slug: string, phase: Phase) => {
  switch (phase) {
    case "THEMES":
      return `/r/${slug}/themes`;
    case "IDEAS":
      return `/r/${slug}/ideas`;
    case "RECAP":
    case "CLOSED":
      return `/r/${slug}/recap`;
  }
};
