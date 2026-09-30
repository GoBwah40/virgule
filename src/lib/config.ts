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

/** Refresh interval when Pusher is not configured. */
export const POLL_INTERVAL_MS = 3000;
/** Safety net when Pusher is active (missed message, reconnection…). */
export const SAFETY_POLL_INTERVAL_MS = 30000;

/** Durations offered for the ideas timer, in minutes. */
export const IDEAS_TIMER_OPTIONS: readonly number[] = [3, 5, 10, 15];
/** Time added by the host's "+2 min" button. */
export const EXTEND_TIMER_MINUTES = 2;
