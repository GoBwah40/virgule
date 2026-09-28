export const MAX_PARTICIPANTS = 6;
export const ROOM_TTL_DAYS = 7;
export const MAX_THEMES = 20;

export const LIMITS = {
  roomName: 80,
  pseudo: 30,
  themeTitle: 100,
  themeDescription: 300,
  idea: 500,
} as const;

/** Intervalle de rafraîchissement quand Pusher n'est pas configuré. */
export const POLL_INTERVAL_MS = 3000;
/** Filet de sécurité quand Pusher est actif (message manqué, reconnexion…). */
export const SAFETY_POLL_INTERVAL_MS = 30000;
