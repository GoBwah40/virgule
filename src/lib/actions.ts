"use server";

import { randomBytes } from "node:crypto";

import { customAlphabet } from "nanoid";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { Phase } from "@/generated/prisma/enums";
import {
  canRemoveParticipants,
  EXTEND_TIMER_MINUTES,
  ideaEditableUntil,
  IDEAS_TIMER_OPTIONS,
  DEFAULT_ROOM_SIZE,
  LIMITS,
  MAX_PENDING_SUGGESTIONS,
  MAX_THEMES,
  NUDGE_COOLDOWN_SECONDS,
  roomCapacity,
  ROOM_SIZES,
  ROOM_TTL_DAYS,
  SCREEN_CODE_TTL_MINUTES,
  VOTE_LIMIT_OPTIONS,
} from "@/lib/config";
import { db } from "@/lib/db";
import { notifyRoom } from "@/lib/realtime/server";
import { ideaKey, type IdeaInput, parseChoiceOptions, parseIdeaInput, readChoiceOptions, textKey, THEME_KINDS, type ThemeKind } from "@/lib/idea-value";
import { isActiveInRound, isQualified, scoreVotes, topQualified } from "@/lib/results";
import { phasePath } from "@/lib/phase-path";
import { isRateLimited } from "@/lib/rate-limit";
import { getRoomContext } from "@/lib/room";
import { hashScreenCode, newScreenCode, normalizeScreenCode } from "@/lib/screen-code";
import { clearParticipantToken, setParticipantToken, setScreenToken } from "@/lib/session";

// i18n message keys ("errors" namespace in messages/*.json).
type ActionError =
  | "invalidInput"
  | "roomNotFound"
  | "roomExpired"
  | "roomFull"
  | "roomClosed"
  | "pseudoTaken"
  | "notJoined"
  | "notHost"
  | "wrongPhase"
  | "tooManyThemes"
  | "noThemes"
  | "ideaNotFound"
  | "notAuthor"
  | "selfVoteForbidden"
  | "invalidDateRange"
  | "invalidAmountRange"
  | "themeKindLocked"
  | "duplicateIdea"
  | "tiebreakNoNewIdeas"
  | "noTies"
  | "participantNotFound"
  | "cannotTargetSelf"
  | "invalidOptions"
  | "choiceClosed"
  | "tooManyRequests"
  | "hostCannotLeave"
  | "tooManySuggestions"
  | "duplicateTheme"
  | "suggestionNotFound"
  | "sizeBelowParticipants"
  | "voteLimitReached"
  | "invalidScreenCode"
  | "themeInPastRounds"
  | "voteLimitBelowUsed"
  | "editWindowOver"
  | "timerRunning"
  | "nudgeTooSoon"
  | "unknown";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

const fail = (error: ActionError): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

// Readable, unguessable slug: 10 unambiguous characters (no 0/O, 1/l…).
const newSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);
const newToken = () => randomBytes(24).toString("base64url");

const text = (max: number) => z.string().trim().min(1).max(max);

// Server Action arguments arrive from the client as-is, whatever their TypeScript type:
// an object in place of an id would become a Prisma filter ({ not: "" } matches everything).
const idSchema = z.string().min(1).max(64);
const isId = (value: unknown): value is string => idSchema.safeParse(value).success;
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

/** End of the ideas timer, if the host has set one. */
const timerEnd = (minutes: number | null) => (minutes ? new Date(Date.now() + minutes * 60_000) : null);

class ActionFailure extends Error {
  constructor(public readonly code: ActionError) {
    super(code);
  }
}

/** Checks that the caller has joined the room (and, if asked, is the host / in the right phase). */
async function guard(slug: string, opts: { host?: boolean; phase?: Phase } = {}) {
  if (!isId(slug)) throw new ActionFailure("invalidInput");
  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") throw new ActionFailure("roomNotFound");
  if (ctx.status === "expired") throw new ActionFailure("roomExpired");
  if (!ctx.me) throw new ActionFailure("notJoined");
  if (await isRateLimited("participant", ctx.me.id)) throw new ActionFailure("tooManyRequests");
  if (opts.host && !ctx.me.isHost) throw new ActionFailure("notHost");
  if (opts.phase && ctx.room.phase !== opts.phase) throw new ActionFailure("wrongPhase");
  return { room: ctx.room, me: ctx.me };
}

/**
 * Shared wrapper: translates errors, notifies the other participants, then
 * - refreshes the caller's page (general case);
 * - or, if the action changes step (`goTo`), sends them straight to the new page.
 *   Refreshing the old page would make it redirect server-side, with an empty
 *   intermediate render that breaks the transition between steps.
 */
async function run(slug: string, fn: () => Promise<void>, goTo?: Phase): Promise<ActionResult> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    console.error("[action]", error);
    return fail("unknown");
  }
  await notifyRoom(slug);
  if (goTo) redirect(phasePath(slug, goTo));
  refresh();
  return ok();
}

// ─── Creation / access ─────────────────────────────────────────────────────

const roomSizeSchema = z.number().refine((size) => ROOM_SIZES.includes(size));
const createSchema = z.object({
  name: text(LIMITS.roomName),
  pseudo: text(LIMITS.pseudo),
  size: roomSizeSchema.default(DEFAULT_ROOM_SIZE),
});

export async function createRoom(input: { name: string; pseudo: string; size?: number }): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  if (await isRateLimited("createRoom")) return fail("tooManyRequests");

  const slug = newSlug();
  const token = newToken();
  await db.room.create({
    data: {
      slug,
      name: parsed.data.name,
      maxParticipants: parsed.data.size,
      expiresAt: new Date(Date.now() + ROOM_TTL_DAYS * 24 * 60 * 60 * 1000),
      participants: { create: { pseudo: parsed.data.pseudo, token, isHost: true } },
    },
  });
  await setParticipantToken(slug, token);
  redirect(`/r/${slug}/themes`);
}

/**
 * A session that is over starts again with the same topics and settings, as a new session hosted
 * by whoever asks: same name and size, no ideas, no votes, no one else seated yet.
 */
export async function reuseTopics(slug: string): Promise<ActionResult> {
  const newRoomSlug = newSlug();
  const token = newToken();
  try {
    const { room, me } = await guard(slug, { phase: "CLOSED" });
    if (await isRateLimited("createRoom")) throw new ActionFailure("tooManyRequests");
    const source = await db.room.findUniqueOrThrow({
      where: { id: room.id },
      include: { themes: { orderBy: { position: "asc" } } },
    });
    await db.room.create({
      data: {
        slug: newRoomSlug,
        name: source.name,
        maxParticipants: source.maxParticipants,
        allowSelfVote: source.allowSelfVote,
        requireNetPositive: source.requireNetPositive,
        ideasTimerMinutes: source.ideasTimerMinutes,
        autoRecap: source.autoRecap,
        expiresAt: new Date(Date.now() + ROOM_TTL_DAYS * 24 * 60 * 60 * 1000),
        participants: { create: { pseudo: me.pseudo, token, isHost: true } },
        themes: {
          create: source.themes.map((theme, position) => ({
            title: theme.title,
            description: theme.description,
            kind: theme.kind,
            options: theme.options,
            allowOtherIdeas: theme.allowOtherIdeas,
            singleChoice: theme.singleChoice,
            maxVotes: theme.maxVotes,
            position,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    console.error("[action]", error);
    return fail("unknown");
  }
  await setParticipantToken(newRoomSlug, token);
  redirect(`/r/${newRoomSlug}/themes`);
}

export async function joinRoom(slug: string, input: { pseudo: string }): Promise<ActionResult> {
  if (!isId(slug)) return fail("invalidInput");
  const parsed = z.object({ pseudo: text(LIMITS.pseudo) }).safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const pseudo = parsed.data.pseudo;

  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") return fail("roomNotFound");
  if (ctx.status === "expired") return fail("roomExpired");
  if (ctx.me) redirect(phasePath(slug, ctx.room.phase));
  // Before the checks below: they would otherwise tell, unlimited, which first names are taken.
  if (await isRateLimited("joinRoom")) return fail("tooManyRequests");
  if (ctx.room.phase === "CLOSED") return fail("roomClosed");
  if (ctx.participants.length >= ctx.room.capacity) return fail("roomFull");
  const sameName = (other: string) => other.toLowerCase() === pseudo.toLowerCase();
  if (ctx.participants.some((p) => sameName(p.pseudo))) return fail("pseudoTaken");

  const token = newToken();
  try {
    await db.$transaction(async (tx) => {
      await tx.participant.create({ data: { roomId: ctx.room.id, pseudo, token } });
      // Checked again after the insert, against the room as it is now: two people taking the last
      // seat or the same first name (in any case) at once, or the host shrinking the room meanwhile.
      const room = await tx.room.findUniqueOrThrow({
        where: { id: ctx.room.id },
        select: { maxParticipants: true, participants: { select: { pseudo: true } } },
      });
      if (room.participants.length > roomCapacity(room)) throw new ActionFailure("roomFull");
      if (room.participants.filter((p) => sameName(p.pseudo)).length > 1) throw new ActionFailure("pseudoTaken");
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    // Unique constraint (roomId, pseudo) violated by a concurrent join with the exact same name.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("pseudoTaken");
    console.error("[action]", error);
    return fail("unknown");
  }

  await setParticipantToken(slug, token);
  await notifyRoom(slug);
  redirect(phasePath(slug, ctx.room.phase));
}

// ─── Phase 1: themes (host) ────────────────────────────────────────────────

const themeSchema = z.object({
  title: text(LIMITS.themeTitle),
  description: z.string().trim().max(LIMITS.themeDescription).optional(),
  kind: z.enum(THEME_KINDS).default("TEXT"),
  options: z.array(z.string()).optional(),
  allowOtherIdeas: z.boolean().optional(),
  singleChoice: z.boolean().optional(),
  maxVotes: z
    .number()
    .refine((n) => VOTE_LIMIT_OPTIONS.includes(n))
    .nullable()
    .optional(),
});

type ThemeInput = {
  title: string;
  description?: string;
  kind?: ThemeKind;
  /** CHOICE topics: options set by the host. */
  options?: string[];
  allowOtherIdeas?: boolean;
  /** CHOICE topics: one option per person. */
  singleChoice?: boolean;
  /** Maximum "for" votes per participant (null = no limit). */
  maxVotes?: number | null;
};

/** Topic fields to save; options only exist for a list. */
function themeFields(data: z.infer<typeof themeSchema>) {
  const base = { title: data.title, description: data.description || null, kind: data.kind, maxVotes: data.maxVotes ?? null };
  if (data.kind !== "CHOICE") return { ...base, options: null, allowOtherIdeas: false, singleChoice: false };
  const options = parseChoiceOptions(data.options);
  if (!options) throw new ActionFailure("invalidOptions");
  const singleChoice = data.singleChoice ?? false;
  return {
    ...base,
    options: JSON.stringify(options),
    allowOtherIdeas: data.allowOtherIdeas ?? false,
    singleChoice,
    // One answer per person is already a limit of one.
    maxVotes: singleChoice ? null : base.maxVotes,
  };
}

export async function addTheme(slug: string, input: ThemeInput) {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const count = await db.theme.count({ where: { roomId: room.id } });
    if (count >= MAX_THEMES) throw new ActionFailure("tooManyThemes");
    const last = await db.theme.findFirst({ where: { roomId: room.id }, orderBy: { position: "desc" } });
    await db.theme.create({
      data: { roomId: room.id, ...themeFields(parsed.data), position: (last?.position ?? -1) + 1 },
    });
  });
}

export async function updateTheme(
  slug: string,
  themeId: string,
  input: ThemeInput,
) {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success || !isId(themeId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const theme = await db.theme.findFirst({
      where: { id: themeId, roomId: room.id },
      select: { kind: true, singleChoice: true, maxVotes: true, _count: { select: { ideas: true } } },
    });
    if (!theme) throw new ActionFailure("invalidInput");
    const fields = themeFields(parsed.data);
    // Changing the kind would make ideas already submitted unreadable; switching to a single
    // answer would leave votes already cast (several options, "against") that break the rule.
    const changed = theme.kind !== fields.kind || theme.singleChoice !== fields.singleChoice;
    if (changed && theme._count.ideas > 0) throw new ActionFailure("themeKindLocked");
    // A tighter limit must still hold the "for" votes already cast in this round.
    const limit = fields.maxVotes;
    if (limit !== null && (theme.maxVotes === null || limit < theme.maxVotes) && (await mostForVotes(themeId, room.round)) > limit) {
      throw new ActionFailure("voteLimitBelowUsed");
    }
    await db.theme.update({ where: { id: themeId }, data: fields });
  });
}

/** Highest number of "for" votes a single participant has cast in this topic this round. */
async function mostForVotes(themeId: string, round: number) {
  const votes = await db.vote.findMany({
    where: { round, positive: true, idea: { themeId } },
    select: { participantId: true, idea: { select: { createdRound: true, eliminatedRound: true } } },
  });
  const counts = new Map<string, number>();
  for (const vote of votes) {
    if (isActiveInRound(vote.idea, round)) counts.set(vote.participantId, (counts.get(vote.participantId) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

export async function deleteTheme(slug: string, themeId: string) {
  if (!isId(themeId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    // Its ideas from earlier rounds are part of recaps already seen (and of the exports).
    const past = await db.idea.count({ where: { themeId, roomId: room.id, createdRound: { lt: room.round } } });
    if (past > 0) throw new ActionFailure("themeInPastRounds");
    await db.theme.deleteMany({ where: { id: themeId, roomId: room.id } });
  });
}

export async function moveTheme(slug: string, themeId: string, direction: "up" | "down") {
  if (!isId(themeId) || (direction !== "up" && direction !== "down")) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const themes = await db.theme.findMany({ where: { roomId: room.id }, orderBy: { position: "asc" } });
    const index = themes.findIndex((t) => t.id === themeId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= themes.length) return;
    const a = themes[index];
    const b = themes[target];
    await db.$transaction([
      db.theme.update({ where: { id: a.id }, data: { position: b.position } }),
      db.theme.update({ where: { id: b.id }, data: { position: a.position } }),
    ]);
  });
}

export async function setAllowSelfVote(slug: string, value: boolean) {
  if (!isBoolean(value)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    // Turned off: votes already cast this round on one's own ideas would break the rule.
    // List options belong to no one, so their votes stay.
    const ownVotes = value
      ? []
      : await db.vote.findMany({
          where: { round: room.round, idea: { roomId: room.id, isOption: false } },
          select: { id: true, participantId: true, idea: { select: { authorId: true } } },
        });
    await db.$transaction([
      db.room.update({ where: { id: room.id }, data: { allowSelfVote: value } }),
      db.vote.deleteMany({ where: { id: { in: ownVotes.filter((v) => v.idea.authorId === v.participantId).map((v) => v.id) } } }),
    ]);
  });
}

export async function startIdeasPhase(slug: string) {
  return run(slug, async () => {
    const { room, me } = await guard(slug, { host: true, phase: "THEMES" });
    const themes = await db.theme.findMany({
      where: { roomId: room.id },
      include: { ideas: { select: { content: true, createdRound: true, eliminatedRound: true } } },
    });
    if (themes.length === 0) throw new ActionFailure("noThemes");
    // Lists: each option becomes an idea to vote on. When coming back from the ideas, only
    // options added in the meantime are created (removed ones stay, and can be deleted).
    const optionIdeas = themes.flatMap((theme) => {
      if (theme.kind !== "CHOICE") return [];
      const present = new Set(theme.ideas.filter((i) => isActiveInRound(i, room.round)).map((i) => textKey(i.content)));
      return readChoiceOptions(theme.options)
        .filter((content) => !present.has(textKey(content)))
        .map((content) => ({
          roomId: room.id,
          themeId: theme.id,
          authorId: me.id,
          content,
          createdRound: room.round,
          isOption: true,
        }));
    });
    await db.$transaction(async (tx) => {
      // The phase is claimed before creating the options: a second request (double click,
      // two tabs) finds it already taken instead of creating every option a second time.
      const claimed = await tx.room.updateMany({
        where: { id: room.id, phase: "THEMES" },
        data: { phase: "IDEAS", phaseEndsAt: timerEnd(room.ideasTimerMinutes) },
      });
      if (claimed.count === 0) throw new ActionFailure("wrongPhase");
      await tx.idea.createMany({ data: optionIdeas });
    });
  }, "IDEAS");
}

// ─── Phase 1: topic suggestions (participants → host) ──────────────────────

const suggestionSchema = z.object({
  title: text(LIMITS.themeTitle),
  description: z.string().trim().max(LIMITS.themeDescription).optional(),
});

/** Same title as an existing topic or a suggestion still waiting (case and spaces ignored). */
async function isTakenThemeTitle(roomId: string, title: string) {
  const [themes, suggestions] = await Promise.all([
    db.theme.findMany({ where: { roomId }, select: { title: true } }),
    db.themeSuggestion.findMany({ where: { roomId }, select: { title: true } }),
  ]);
  const key = textKey(title);
  return [...themes, ...suggestions].some((row) => textKey(row.title) === key);
}

/** A participant suggests a topic; the host adds it to the list or dismisses it. */
export async function suggestTheme(slug: string, input: { title: string; description?: string }) {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "THEMES" });
    const pending = await db.themeSuggestion.count({ where: { roomId: room.id, authorId: me.id } });
    if (pending >= MAX_PENDING_SUGGESTIONS) throw new ActionFailure("tooManySuggestions");
    if (await isTakenThemeTitle(room.id, parsed.data.title)) throw new ActionFailure("duplicateTheme");
    await db.themeSuggestion.create({
      data: {
        roomId: room.id,
        authorId: me.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
      },
    });
  });
}

/** The host turns a suggestion into a topic (free text; they can edit it afterwards). */
export async function acceptThemeSuggestion(slug: string, suggestionId: string) {
  if (!isId(suggestionId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const suggestion = await db.themeSuggestion.findFirst({ where: { id: suggestionId, roomId: room.id } });
    if (!suggestion) throw new ActionFailure("suggestionNotFound");
    const count = await db.theme.count({ where: { roomId: room.id } });
    if (count >= MAX_THEMES) throw new ActionFailure("tooManyThemes");
    const last = await db.theme.findFirst({ where: { roomId: room.id }, orderBy: { position: "desc" } });
    await db.$transaction([
      db.theme.create({
        data: {
          roomId: room.id,
          title: suggestion.title,
          description: suggestion.description,
          position: (last?.position ?? -1) + 1,
        },
      }),
      db.themeSuggestion.delete({ where: { id: suggestion.id } }),
    ]);
  });
}

/** The host dismisses a suggestion, or its author withdraws it. */
export async function deleteThemeSuggestion(slug: string, suggestionId: string) {
  if (!isId(suggestionId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "THEMES" });
    const suggestion = await db.themeSuggestion.findFirst({ where: { id: suggestionId, roomId: room.id } });
    if (!suggestion) throw new ActionFailure("suggestionNotFound");
    if (!me.isHost && suggestion.authorId !== me.id) throw new ActionFailure("notAuthor");
    await db.themeSuggestion.delete({ where: { id: suggestion.id } });
  });
}

/** Room size, chosen at creation; the host can change it while preparing the topics. */
export async function setRoomSize(slug: string, size: number) {
  if (!roomSizeSchema.safeParse(size).success) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    // Counted after the change, in the same transaction: someone joining at that moment is
    // either counted here or refused by the join, which checks the size again.
    await db.$transaction(async (tx) => {
      await tx.room.update({ where: { id: room.id }, data: { maxParticipants: size } });
      const count = await tx.participant.count({ where: { roomId: room.id } });
      if (size < count) throw new ActionFailure("sizeBelowParticipants");
    });
  });
}

/** The session moves to the recap by itself when the ideas timer runs out. */
export async function setAutoRecap(slug: string, value: boolean) {
  if (!isBoolean(value)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    await db.room.update({ where: { id: room.id }, data: { autoRecap: value } });
  });
}

/** Ideas phase timer (null = none), set before starting the ideas. */
export async function setIdeasTimer(slug: string, minutes: number | null) {
  if (minutes !== null && !IDEAS_TIMER_OPTIONS.includes(minutes)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    await db.room.update({ where: { id: room.id }, data: { ideasTimerMinutes: minutes } });
  });
}

// ─── Phase 2: ideas & votes ────────────────────────────────────────────────

const ideaInputSchema = z.object({
  content: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
});

/** Text idea (`content`) or typed one (dates / amounts), validated against the topic kind. */
export async function addIdea(slug: string, themeId: string, input: IdeaInput) {
  const raw = ideaInputSchema.safeParse(input);
  if (!raw.success || !isId(themeId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    if (room.tiebreak) throw new ActionFailure("tiebreakNoNewIdeas");
    const theme = await db.theme.findFirst({ where: { id: themeId, roomId: room.id } });
    if (!theme) throw new ActionFailure("invalidInput");
    if (theme.kind === "CHOICE" && !theme.allowOtherIdeas) throw new ActionFailure("choiceClosed");
    const parsed = parseIdeaInput(theme.kind, raw.data);
    if (!parsed.ok) throw new ActionFailure(parsed.error);
    // Duplicate: same value as an idea still in the running in this topic (visible to all).
    // Checked after the insert, in the same transaction: the same idea sent by two people at
    // once is kept once.
    const key = ideaKey(theme.kind, parsed.fields);
    await db.$transaction(async (tx) => {
      await tx.idea.create({
        data: {
          roomId: room.id,
          themeId,
          authorId: me.id,
          ...parsed.fields,
          createdRound: room.round,
        },
      });
      const ideas = await tx.idea.findMany({ where: { themeId } });
      const same = ideas.filter((idea) => isActiveInRound(idea, room.round) && ideaKey(theme.kind, idea) === key);
      if (same.length > 1) throw new ActionFailure("duplicateIdea");
    });
  });
}

/**
 * The author changes their idea, within IDEA_EDIT_MINUTES of suggesting it. Votes already cast
 * on it are removed: they were for something else.
 */
export async function updateIdea(slug: string, ideaId: string, input: IdeaInput) {
  const raw = ideaInputSchema.safeParse(input);
  if (!raw.success || !isId(ideaId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const idea = await db.idea.findFirst({ where: { id: ideaId, roomId: room.id }, include: { theme: true } });
    if (!idea) throw new ActionFailure("ideaNotFound");
    if (idea.isOption || idea.authorId !== me.id || idea.createdRound !== room.round) throw new ActionFailure("notAuthor");
    // A little leeway for the request on its way.
    if (Date.now() > ideaEditableUntil(idea.createdAt).getTime() + 10_000) throw new ActionFailure("editWindowOver");
    const parsed = parseIdeaInput(idea.theme.kind, raw.data);
    if (!parsed.ok) throw new ActionFailure(parsed.error);
    const others = await db.idea.findMany({ where: { themeId: idea.themeId, id: { not: idea.id } } });
    const key = ideaKey(idea.theme.kind, parsed.fields);
    if (others.some((other) => isActiveInRound(other, room.round) && ideaKey(idea.theme.kind, other) === key)) {
      throw new ActionFailure("duplicateIdea");
    }
    // Unchanged: nothing to save, and nobody's vote is lost (a fixed typo or accent does count).
    const fields = parsed.fields;
    const same = (Object.keys(fields) as (keyof typeof fields)[]).every((field) => fields[field] === idea[field]);
    if (same) return;
    await db.$transaction([
      db.idea.update({ where: { id: idea.id }, data: { ...parsed.fields, editedAt: new Date() } }),
      db.vote.deleteMany({ where: { ideaId: idea.id } }),
    ]);
  });
}

export async function deleteIdea(slug: string, ideaId: string) {
  if (!isId(ideaId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const idea = await db.idea.findFirst({ where: { id: ideaId, roomId: room.id } });
    if (!idea) throw new ActionFailure("ideaNotFound");
    // An idea carried over from a previous round can no longer be removed. List options
    // belong to whoever is hosting.
    const owner = idea.isOption ? me.isHost : idea.authorId === me.id;
    if (!owner || idea.createdRound !== room.round) throw new ActionFailure("notAuthor");
    await db.idea.delete({ where: { id: idea.id } });
  });
}

/**
 * `positive = null` removes the vote. In a single-answer list, only "for" exists and
 * picking an idea removes the vote on the one picked before.
 */
export async function castVote(slug: string, ideaId: string, positive: boolean | null) {
  if (!isId(ideaId) || (positive !== null && !isBoolean(positive))) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const idea = await db.idea.findFirst({
      where: { id: ideaId, roomId: room.id },
      include: { theme: { select: { kind: true, singleChoice: true, maxVotes: true } } },
    });
    if (!idea || !isActiveInRound(idea, room.round)) throw new ActionFailure("ideaNotFound");
    if (!room.allowSelfVote && idea.authorId === me.id && !idea.isOption) throw new ActionFailure("selfVoteForbidden");
    const single = idea.theme.kind === "CHOICE" && idea.theme.singleChoice;
    if (single && positive === false) throw new ActionFailure("invalidInput");
    const key = { ideaId, participantId: me.id, round: room.round };
    const where = { ideaId_participantId_round: key };
    if (positive === null) {
      await db.vote.deleteMany({ where: key });
    } else if (positive && !single && idea.theme.maxVotes !== null) {
      // Limited topic: the "for" vote must fit in the participant's allowance for this round.
      // Counted after writing, in the same transaction: two votes sent at once cannot both
      // pass a count made before either of them was written.
      const max = idea.theme.maxVotes;
      await db.$transaction(async (tx) => {
        await tx.vote.upsert({ where, create: { ...key, positive }, update: { positive } });
        const mine = await tx.vote.findMany({
          where: { participantId: me.id, round: room.round, positive: true, idea: { themeId: idea.themeId } },
          select: { idea: { select: { createdRound: true, eliminatedRound: true } } },
        });
        if (mine.filter((v) => isActiveInRound(v.idea, room.round)).length > max) throw new ActionFailure("voteLimitReached");
      });
    } else {
      await db.$transaction([
        ...(single
          ? [
              db.vote.deleteMany({
                where: { participantId: me.id, round: room.round, ideaId: { not: ideaId }, idea: { themeId: idea.themeId } },
              }),
            ]
          : []),
        db.vote.upsert({ where, create: { ...key, positive }, update: { positive } }),
      ]);
    }
  });
}

/** Back to defining themes: ideas and votes are kept. */
export async function backToThemes(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    await db.room.update({ where: { id: room.id }, data: { phase: "THEMES", phaseEndsAt: null } });
  }, "THEMES");
}

export async function goToRecap(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    await db.room.update({ where: { id: room.id }, data: { phase: "RECAP", phaseEndsAt: null, recapSeen: true } });
  }, "RECAP");
}

/**
 * The ideas timer has run out and the host chose to move on by itself: any participant's page
 * asks, the server's clock decides. Only the first request moves the session; the others find
 * the step already changed.
 */
export async function goToRecapOnTimer(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { phase: "IDEAS" });
    if (!room.autoRecap || !room.phaseEndsAt) throw new ActionFailure("wrongPhase");
    const moved = await db.room.updateMany({
      where: { id: room.id, phase: "IDEAS", autoRecap: true, phaseEndsAt: { lte: new Date() } },
      data: { phase: "RECAP", phaseEndsAt: null, recapSeen: true },
    });
    if (moved.count === 0) throw new ActionFailure(room.phaseEndsAt > new Date() ? "timerRunning" : "wrongPhase");
  }, "RECAP");
}

/** Adds time to the running timer (restarts from now if it has already run out). */
export async function extendTimer(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    const from = Math.max(Date.now(), room.phaseEndsAt?.getTime() ?? 0);
    await db.room.update({
      where: { id: room.id },
      data: { phaseEndsAt: new Date(from + EXTEND_TIMER_MINUTES * 60_000) },
    });
  });
}

export async function stopTimer(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    await db.room.update({ where: { id: room.id }, data: { phaseEndsAt: null } });
  });
}

/**
 * Anonymous reminder to vote: each page shows it to its participant only if they still have
 * ideas left without their vote, so nobody, the host included, learns who received it.
 * At most one per NUDGE_COOLDOWN_SECONDS: the conditional update lets only one request through.
 */
export async function nudgeVoters(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    const now = new Date();
    const claimed = await db.room.updateMany({
      where: {
        id: room.id,
        phase: "IDEAS",
        OR: [{ nudgedAt: null }, { nudgedAt: { lte: new Date(now.getTime() - NUDGE_COOLDOWN_SECONDS * 1000) } }],
      },
      data: { nudgedAt: now },
    });
    if (claimed.count === 0) throw new ActionFailure("nudgeTooSoon");
  });
}

// ─── Phase 3: recap (host) ─────────────────────────────────────────────────

export async function reopenVoting(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({
      where: { id: room.id },
      data: { phase: "IDEAS", phaseEndsAt: timerEnd(room.ideasTimerMinutes) },
    });
  }, "IDEAS");
}

export async function setRequireNetPositive(slug: string, value: boolean) {
  if (!isBoolean(value)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({ where: { id: room.id }, data: { requireNetPositive: value } });
  });
}

/** Eliminates the ideas not kept, then opens the next round (votes reset). */
export async function startNextRound(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    const ideas = await db.idea.findMany({
      where: { roomId: room.id, eliminatedRound: null },
      include: { votes: { where: { round: room.round }, select: { positive: true } } },
    });
    const eliminated = ideas
      .filter((idea) => !isQualified(scoreVotes(idea.votes), room.requireNetPositive))
      .map((idea) => idea.id);
    const nextRound = room.round + 1;
    await db.$transaction([
      db.idea.updateMany({ where: { id: { in: eliminated } }, data: { eliminatedRound: nextRound } }),
      db.room.update({
        where: { id: room.id },
        data: { round: nextRound, phase: "IDEAS", tiebreak: false, phaseEndsAt: timerEnd(room.ideasTimerMinutes) },
      }),
    ]);
  }, "IDEAS");
}

/**
 * Tiebreak round: in each topic, only the leading ideas remain (the tied ones, or the
 * winning idea when there is no tie). Votes reset, no new ideas.
 */
export async function startTiebreakRound(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    const ideas = await db.idea.findMany({
      where: { roomId: room.id, eliminatedRound: null },
      include: { votes: { where: { round: room.round }, select: { positive: true } } },
    });
    const scored = ideas.map((idea) => {
      const score = scoreVotes(idea.votes);
      return { id: idea.id, themeId: idea.themeId, score, qualified: isQualified(score, room.requireNetPositive) };
    });
    const byTheme = new Map<string, typeof scored>();
    for (const idea of scored) byTheme.set(idea.themeId, [...(byTheme.get(idea.themeId) ?? []), idea]);
    const kept = new Set<string>();
    let hasTie = false;
    for (const themeIdeas of byTheme.values()) {
      const top = topQualified(themeIdeas);
      if (top.length > 1) hasTie = true;
      for (const idea of top) kept.add(idea.id);
    }
    if (!hasTie) throw new ActionFailure("noTies");

    const nextRound = room.round + 1;
    await db.$transaction([
      db.idea.updateMany({
        where: { id: { in: scored.filter((idea) => !kept.has(idea.id)).map((idea) => idea.id) } },
        data: { eliminatedRound: nextRound },
      }),
      db.room.update({
        where: { id: room.id },
        data: { round: nextRound, phase: "IDEAS", tiebreak: true, phaseEndsAt: timerEnd(room.ideasTimerMinutes) },
      }),
    ]);
  }, "IDEAS");
}

export async function closeSession(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({ where: { id: room.id }, data: { phase: "CLOSED" } });
  });
}

// ─── Read-only recap link (host) ───────────────────────────────────────────

/** Recap shown, or the session over: the only steps a recap link makes sense from. */
async function guardRecapHost(slug: string) {
  const { room } = await guard(slug, { host: true });
  if (room.phase !== "RECAP" && room.phase !== "CLOSED") throw new ActionFailure("wrongPhase");
  return room;
}

/** The host turns on a link to the recap for people who were not there: no seat, nothing to change. */
export async function enableShareLink(slug: string) {
  return run(slug, async () => {
    const room = await guardRecapHost(slug);
    // Already on: the same link stays, so the one already sent keeps working.
    await db.room.updateMany({ where: { id: room.id, shareToken: null }, data: { shareToken: newToken() } });
  });
}

/** The link stops working; turning it on again gives a new one. */
export async function disableShareLink(slug: string) {
  return run(slug, async () => {
    const room = await guardRecapHost(slug);
    await db.room.update({ where: { id: room.id }, data: { shareToken: null } });
  });
}

// ─── Participants (host) ───────────────────────────────────────────────────

async function otherParticipant(roomId: string, meId: string, participantId: string) {
  if (participantId === meId) throw new ActionFailure("cannotTargetSelf");
  const target = await db.participant.findFirst({ where: { id: participantId, roomId } });
  if (!target) throw new ActionFailure("participantNotFound");
  return target;
}

/** Hands hosting over to another participant; the former host stays in the session. */
export async function transferHost(slug: string, participantId: string) {
  if (!isId(participantId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { host: true });
    if (room.phase === "CLOSED") throw new ActionFailure("wrongPhase");
    const target = await otherParticipant(room.id, me.id, participantId);
    await db.$transaction(async (tx) => {
      // Only one handover goes through: a second one (two taps, two tabs) finds that this
      // person no longer hosts, instead of making two hosts.
      const released = await tx.participant.updateMany({ where: { id: me.id, isHost: true }, data: { isHost: false } });
      if (released.count === 0) throw new ActionFailure("notHost");
      await tx.participant.update({ where: { id: target.id }, data: { isHost: true } });
    });
  });
}

/**
 * Removes a participant (seat taken by mistake). Their ideas and votes are deleted with
 * them; they can come back with the link if a seat is left. Only before the first recap
 * (`canRemoveParticipants`): afterwards, it would change the results.
 */
export async function removeParticipant(slug: string, participantId: string) {
  if (!isId(participantId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { host: true });
    if (!canRemoveParticipants(room)) throw new ActionFailure("wrongPhase");
    const target = await otherParticipant(room.id, me.id, participantId);
    await db.$transaction([
      // List options created by this person (while they were hosting) are kept.
      db.idea.updateMany({ where: { authorId: target.id, isOption: true }, data: { authorId: me.id } }),
      db.participant.delete({ where: { id: target.id } }),
    ]);
  });
}

/**
 * A participant leaves the session: their seat is freed, their ideas and votes are deleted
 * with them. Whoever is hosting hands over hosting first; only before the first recap
 * (`canRemoveParticipants`).
 */
export async function leaveRoom(slug: string): Promise<ActionResult> {
  try {
    const { room, me } = await guard(slug);
    if (me.isHost) throw new ActionFailure("hostCannotLeave");
    // Same rule as removing someone: afterwards, leaving would change the results.
    if (!canRemoveParticipants(room)) throw new ActionFailure("wrongPhase");
    const host = await db.participant.findFirst({ where: { roomId: room.id, isHost: true }, select: { id: true } });
    await db.$transaction([
      // List options created while this person was hosting stay, with whoever hosts now.
      ...(host ? [db.idea.updateMany({ where: { authorId: me.id, isOption: true }, data: { authorId: host.id } })] : []),
      db.participant.delete({ where: { id: me.id } }),
    ]);
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    console.error("[action]", error);
    return fail("unknown");
  }
  await clearParticipantToken(slug);
  await notifyRoom(slug);
  redirect("/");
}

// ─── Room screen pairing ───────────────────────────────────────────────────
// The host shows the session on a TV or a projector without giving it a seat: their phone shows
// a one-time code, typed on the screen. The screen then holds a secret of its own (cookie), and
// sees the room screen only (getPresentationView), never a participant's page.

export type ScreenCodeResult = { ok: true; code: string; expiresAt: string } | { ok: false; error: ActionError };

/** Host: a new pairing code, valid a few minutes; the previous one stops working. */
export async function createScreenCode(slug: string): Promise<ScreenCodeResult> {
  try {
    // Closed sessions too: the recap can still be shown to the room.
    const { room } = await guard(slug, { host: true });
    const expiresAt = new Date(Date.now() + SCREEN_CODE_TTL_MINUTES * 60_000);
    // Another session may hold the same code at that moment (unique hash): draw again.
    for (let attempt = 0; ; attempt++) {
      const code = newScreenCode();
      try {
        await db.room.update({
          where: { id: room.id },
          data: { screenCodeHash: hashScreenCode(code), screenCodeExpiresAt: expiresAt },
        });
        return { ok: true, code, expiresAt: expiresAt.toISOString() };
      } catch (error) {
        if (attempt >= 2) throw error;
      }
    }
  } catch (error) {
    if (error instanceof ActionFailure) return { ok: false, error: error.code };
    console.error("[action]", error);
    return { ok: false, error: "unknown" };
  }
}

/** On the screen: the code typed pairs it with its session, once, then shows the room screen. */
export async function pairScreen(input: { code: string }): Promise<ActionResult> {
  // Every try counts, a wrong one included: codes cannot be found by trying them all.
  if (await isRateLimited("pairScreen")) return fail("tooManyRequests");
  const code = typeof input?.code === "string" ? normalizeScreenCode(input.code) : null;
  if (!code) return fail("invalidScreenCode");

  const hash = hashScreenCode(code);
  const room = await db.room.findUnique({
    where: { screenCodeHash: hash },
    select: { id: true, slug: true, expiresAt: true, screenCodeExpiresAt: true },
  });
  const now = new Date();
  if (!room || !room.screenCodeExpiresAt || room.screenCodeExpiresAt < now) return fail("invalidScreenCode");
  if (room.expiresAt < now) return fail("roomExpired");

  const token = newToken();
  // Single use: typed on two screens at once, only one gets it. A screen paired before stops.
  const { count } = await db.room.updateMany({
    where: { id: room.id, screenCodeHash: hash },
    data: { screenToken: token, screenCodeHash: null, screenCodeExpiresAt: null },
  });
  if (count === 0) return fail("invalidScreenCode");

  await setScreenToken(room.slug, token);
  await notifyRoom(room.slug);
  redirect(`/r/${room.slug}/present`);
}

/** Host: the paired screen stops showing the session (and any code waiting is dropped). */
export async function unpairScreen(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true });
    await db.room.update({
      where: { id: room.id },
      data: { screenToken: null, screenCodeHash: null, screenCodeExpiresAt: null },
    });
  });
}
