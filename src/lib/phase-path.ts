import type { Phase } from "@/generated/prisma/enums";

/** Page matching a session step (usable on both server and client). */
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
