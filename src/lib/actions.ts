"use server";

import { randomBytes } from "node:crypto";

import { customAlphabet } from "nanoid";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Phase } from "@/generated/prisma/enums";
import {
  canRemoveParticipants,
  EXTEND_TIMER_MINUTES,
  IDEAS_TIMER_OPTIONS,
  DEFAULT_ROOM_SIZE,
  LIMITS,
  MAX_PENDING_SUGGESTIONS,
  MAX_THEMES,
  ROOM_SIZES,
  ROOM_TTL_DAYS,
  VOTE_LIMIT_OPTIONS,
} from "@/lib/config";
import { db } from "@/lib/db";
import { notifyRoom } from "@/lib/realtime/server";
import { ideaKey, type IdeaInput, parseChoiceOptions, parseIdeaInput, readChoiceOptions, textKey, THEME_KINDS, type ThemeKind } from "@/lib/idea-value";
import { isActiveInRound, isQualified, scoreVotes, topQualified } from "@/lib/results";
import { phasePath } from "@/lib/phase-path";
import { isRateLimited } from "@/lib/rate-limit";
import { getRoomContext } from "@/lib/room";
import { clearParticipantToken, setParticipantToken } from "@/lib/session";

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

export async function joinRoom(slug: string, input: { pseudo: string }): Promise<ActionResult> {
  if (!isId(slug)) return fail("invalidInput");
  const parsed = z.object({ pseudo: text(LIMITS.pseudo) }).safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const pseudo = parsed.data.pseudo;

  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") return fail("roomNotFound");
  if (ctx.status === "expired") return fail("roomExpired");
  if (ctx.me) redirect(phasePath(slug, ctx.room.phase));
  if (ctx.room.phase === "CLOSED") return fail("roomClosed");
  if (ctx.participants.length >= ctx.room.capacity) return fail("roomFull");
  if (await isRateLimited("joinRoom")) return fail("tooManyRequests");
  if (ctx.participants.some((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase())) {
    return fail("pseudoTaken");
  }

  const token = newToken();
  try {
    await db.$transaction(async (tx) => {
      await tx.participant.create({ data: { roomId: ctx.room.id, pseudo, token } });
      // Recount after insert: guards against two people taking the last seat at the same time.
      const count = await tx.participant.count({ where: { roomId: ctx.room.id } });
      if (count > ctx.room.capacity) throw new ActionFailure("roomFull");
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    // Unique constraint (roomId, pseudo) violated by a concurrent join.
    return fail("pseudoTaken");
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
      select: { kind: true, singleChoice: true, _count: { select: { ideas: true } } },
    });
    if (!theme) throw new ActionFailure("invalidInput");
    const fields = themeFields(parsed.data);
    // Changing the kind would make ideas already submitted unreadable; switching to a single
    // answer would leave votes already cast (several options, "against") that break the rule.
    const changed = theme.kind !== fields.kind || theme.singleChoice !== fields.singleChoice;
    if (changed && theme._count.ideas > 0) throw new ActionFailure("themeKindLocked");
    await db.theme.update({ where: { id: themeId }, data: fields });
  });
}

export async function deleteTheme(slug: string, themeId: string) {
  if (!isId(themeId)) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
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
    await db.room.update({ where: { id: room.id }, data: { allowSelfVote: value } });
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
    await db.$transaction([
      db.idea.createMany({ data: optionIdeas }),
      db.room.update({
        where: { id: room.id },
        data: { phase: "IDEAS", phaseEndsAt: timerEnd(room.ideasTimerMinutes) },
      }),
    ]);
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
    const count = await db.participant.count({ where: { roomId: room.id } });
    if (size < count) throw new ActionFailure("sizeBelowParticipants");
    await db.room.update({ where: { id: room.id }, data: { maxParticipants: size } });
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
    const existing = await db.idea.findMany({ where: { themeId } });
    const key = ideaKey(theme.kind, parsed.fields);
    if (existing.some((idea) => isActiveInRound(idea, room.round) && ideaKey(theme.kind, idea) === key)) {
      throw new ActionFailure("duplicateIdea");
    }
    await db.idea.create({
      data: {
        roomId: room.id,
        themeId,
        authorId: me.id,
        ...parsed.fields,
        createdRound: room.round,
      },
    });
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
    // Limited topic: a new "for" vote must fit in the participant's allowance for this round.
    // A single-answer list replaces the previous pick instead.
    if (positive === true && !single && idea.theme.maxVotes !== null) {
      const mine = await db.vote.findMany({
        where: { participantId: me.id, round: room.round, positive: true, idea: { themeId: idea.themeId } },
        select: { ideaId: true, idea: { select: { createdRound: true, eliminatedRound: true } } },
      });
      const used = mine.filter((v) => v.ideaId !== ideaId && isActiveInRound(v.idea, room.round)).length;
      if (used >= idea.theme.maxVotes) throw new ActionFailure("voteLimitReached");
    }

    const where = { ideaId_participantId_round: { ideaId, participantId: me.id, round: room.round } };
    if (positive === null) {
      await db.vote.deleteMany({ where: where.ideaId_participantId_round });
    } else {
      await db.$transaction([
        ...(single
          ? [
              db.vote.deleteMany({
                where: { participantId: me.id, round: room.round, ideaId: { not: ideaId }, idea: { themeId: idea.themeId } },
              }),
            ]
          : []),
        db.vote.upsert({
          where,
          create: { ideaId, participantId: me.id, round: room.round, positive },
          update: { positive },
        }),
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
    await db.room.update({ where: { id: room.id }, data: { phase: "RECAP", phaseEndsAt: null } });
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
    await db.$transaction([
      db.participant.update({ where: { id: me.id }, data: { isHost: false } }),
      db.participant.update({ where: { id: target.id }, data: { isHost: true } }),
    ]);
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
