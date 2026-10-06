import type { Phase } from "@/generated/prisma/enums";

/**
 * Room sizes the host can choose from. At least 3, or anonymous votes become guessable; at
 * most 12, beyond which voting on every idea gets too long and seats no longer fit the header.
 */
export const ROOM_SIZES: readonly number[] = [4, 6, 8, 12];
export const DEFAULT_ROOM_SIZE = 6;
/** Largest room size (home page: "up to 12 participants"). */
export const MAX_PARTICIPANTS = Math.max(...ROOM_SIZES);
/** Seats in a room: the size chosen by the host, or the default one for older rooms. */
export const roomCapacity = (room: { maxParticipants: number | null }) => room.maxParticipants ?? DEFAULT_ROOM_SIZE;
export const ROOM_TTL_DAYS = 7;
export const MAX_THEMES = 20;
/** Topic suggestions a participant can have waiting for the host at the same time. */
export const MAX_PENDING_SUGGESTIONS = 5;
/**
 * The host can remove someone only before the first recap: afterwards, their ideas and votes
 * (deleted with them) would disappear from results already seen, including past rounds.
 * `recapSeen` covers voting reopened from the recap, which stays in round 1.
 */
export const canRemoveParticipants = (room: { phase: Phase; round: number; recapSeen: boolean }) =>
  room.round === 1 && !room.recapSeen && (room.phase === "THEMES" || room.phase === "IDEAS");

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

/** Validity of a room screen pairing code, shown on the host's phone. */
export const SCREEN_CODE_TTL_MINUTES = 10;

/** Durations offered for the ideas timer, in minutes. */
export const IDEAS_TIMER_OPTIONS: readonly number[] = [3, 5, 10, 15];
/** Limits offered for the "for" votes per participant in a topic (no limit by default). */
export const VOTE_LIMIT_OPTIONS: readonly number[] = [1, 2, 3, 5];
/** Points each participant spreads across a points topic's ideas, per round. */
export const POINTS_BUDGET_OPTIONS: readonly number[] = [3, 5, 10];
export const DEFAULT_POINTS_BUDGET = 5;

/** Time added by the host's "+2 min" button. */
export const EXTEND_TIMER_MINUTES = 2;

/**
 * How long after suggesting an idea its author can still change it. A fixed window rather than
 * "until someone votes": the author must not learn whether anyone has voted on it.
 */
const IDEA_EDIT_MINUTES = 2;
/** End of the window to change an idea. */
export const ideaEditableUntil = (createdAt: Date) => new Date(createdAt.getTime() + IDEA_EDIT_MINUTES * 60_000);

/** Shortest gap between two reminders to vote sent by the host (enforced by the server). */
export const NUDGE_COOLDOWN_SECONDS = 60;
/** When the host can send the next reminder to vote (null: right away). */
export const nextNudgeAt = (nudgedAt: Date | null) =>
  nudgedAt ? new Date(nudgedAt.getTime() + NUDGE_COOLDOWN_SECONDS * 1000) : null;
/**
 * A reminder is shown only while it is recent: someone opening the page later (another tab,
 * the next round) is not reminded of something said minutes ago.
 */
const NUDGE_SHOWN_MINUTES = 5;
export const isRecentNudge = (nudgedAt: Date | null, now = new Date()) =>
  nudgedAt !== null && now.getTime() - nudgedAt.getTime() < NUDGE_SHOWN_MINUTES * 60_000;

/** Public repository of the project, linked from the footer. */
export const REPO_URL = "https://github.com/GoBwah40/virgule";
