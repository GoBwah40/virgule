"use server";

import { randomBytes } from "node:crypto";

import { customAlphabet } from "nanoid";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Phase } from "@/generated/prisma/enums";
import { EXTEND_TIMER_MINUTES, IDEAS_TIMER_OPTIONS, LIMITS, MAX_PARTICIPANTS, MAX_THEMES, ROOM_TTL_DAYS } from "@/lib/config";
import { db } from "@/lib/db";
import { notifyRoom } from "@/lib/realtime/server";
import { ideaKey, type IdeaInput, parseChoiceOptions, parseIdeaInput, readChoiceOptions, textKey, THEME_KINDS, type ThemeKind } from "@/lib/idea-value";
import { isActiveInRound, isQualified, scoreVotes, topQualified } from "@/lib/results";
import { phasePath } from "@/lib/phase-path";
import { getRoomContext } from "@/lib/room";
import { setParticipantToken } from "@/lib/session";

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
  | "unknown";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

const fail = (error: ActionError): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

// Readable, unguessable slug: 10 unambiguous characters (no 0/O, 1/l…).
const newSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);
const newToken = () => randomBytes(24).toString("base64url");

const text = (max: number) => z.string().trim().min(1).max(max);

/** End of the ideas timer, if the host has set one. */
const timerEnd = (minutes: number | null) => (minutes ? new Date(Date.now() + minutes * 60_000) : null);

class ActionFailure extends Error {
  constructor(public readonly code: ActionError) {
    super(code);
  }
}

/** Checks that the caller has joined the room (and, if asked, is the host / in the right phase). */
async function guard(slug: string, opts: { host?: boolean; phase?: Phase } = {}) {
  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") throw new ActionFailure("roomNotFound");
  if (ctx.status === "expired") throw new ActionFailure("roomExpired");
  if (!ctx.me) throw new ActionFailure("notJoined");
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

const createSchema = z.object({ name: text(LIMITS.roomName), pseudo: text(LIMITS.pseudo) });

export async function createRoom(input: { name: string; pseudo: string }): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");

  const slug = newSlug();
  const token = newToken();
  await db.room.create({
    data: {
      slug,
      name: parsed.data.name,
      expiresAt: new Date(Date.now() + ROOM_TTL_DAYS * 24 * 60 * 60 * 1000),
      participants: { create: { pseudo: parsed.data.pseudo, token, isHost: true } },
    },
  });
  await setParticipantToken(slug, token);
  redirect(`/r/${slug}/themes`);
}

export async function joinRoom(slug: string, input: { pseudo: string }): Promise<ActionResult> {
  const parsed = z.object({ pseudo: text(LIMITS.pseudo) }).safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const pseudo = parsed.data.pseudo;

  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") return fail("roomNotFound");
  if (ctx.status === "expired") return fail("roomExpired");
  if (ctx.me) redirect(phasePath(slug, ctx.room.phase));
  if (ctx.room.phase === "CLOSED") return fail("roomClosed");
  if (ctx.participants.length >= MAX_PARTICIPANTS) return fail("roomFull");
  if (ctx.participants.some((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase())) {
    return fail("pseudoTaken");
  }

  const token = newToken();
  try {
    await db.$transaction(async (tx) => {
      await tx.participant.create({ data: { roomId: ctx.room.id, pseudo, token } });
      // Recount after insert: guards against two people taking the last seat at the same time.
      const count = await tx.participant.count({ where: { roomId: ctx.room.id } });
      if (count > MAX_PARTICIPANTS) throw new ActionFailure("roomFull");
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
});

type ThemeInput = {
  title: string;
  description?: string;
  kind?: ThemeKind;
  /** CHOICE topics: options set by the host. */
  options?: string[];
  allowOtherIdeas?: boolean;
};

/** Topic fields to save; options only exist for a list. */
function themeFields(data: z.infer<typeof themeSchema>) {
  const base = { title: data.title, description: data.description || null, kind: data.kind };
  if (data.kind !== "CHOICE") return { ...base, options: null, allowOtherIdeas: false };
  const options = parseChoiceOptions(data.options);
  if (!options) throw new ActionFailure("invalidOptions");
  return { ...base, options: JSON.stringify(options), allowOtherIdeas: data.allowOtherIdeas ?? false };
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
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const theme = await db.theme.findFirst({
      where: { id: themeId, roomId: room.id },
      select: { kind: true, _count: { select: { ideas: true } } },
    });
    if (!theme) throw new ActionFailure("invalidInput");
    // Changing the kind would make ideas already submitted unreadable.
    if (theme.kind !== parsed.data.kind && theme._count.ideas > 0) throw new ActionFailure("themeKindLocked");
    await db.theme.update({ where: { id: themeId }, data: themeFields(parsed.data) });
  });
}

export async function deleteTheme(slug: string, themeId: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    await db.theme.deleteMany({ where: { id: themeId, roomId: room.id } });
  });
}

export async function moveTheme(slug: string, themeId: string, direction: "up" | "down") {
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
  if (!raw.success) return fail("invalidInput");
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

/** `positive = null` removes the vote. */
export async function castVote(slug: string, ideaId: string, positive: boolean | null) {
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const idea = await db.idea.findFirst({ where: { id: ideaId, roomId: room.id } });
    if (!idea || !isActiveInRound(idea, room.round)) throw new ActionFailure("ideaNotFound");
    if (!room.allowSelfVote && idea.authorId === me.id && !idea.isOption) throw new ActionFailure("selfVoteForbidden");

    const where = { ideaId_participantId_round: { ideaId, participantId: me.id, round: room.round } };
    if (positive === null) {
      await db.vote.deleteMany({ where: where.ideaId_participantId_round });
    } else {
      await db.vote.upsert({
        where,
        create: { ideaId, participantId: me.id, round: room.round, positive },
        update: { positive },
      });
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
  return run(slug, async () => {
    const { room, me } = await guard(slug, { host: true });
    const target = await otherParticipant(room.id, me.id, participantId);
    await db.$transaction([
      db.participant.update({ where: { id: me.id }, data: { isHost: false } }),
      db.participant.update({ where: { id: target.id }, data: { isHost: true } }),
    ]);
  });
}

/**
 * Removes a participant (seat taken by mistake). Their ideas and votes are deleted with
 * them; they can come back with the link if a seat is left.
 */
export async function removeParticipant(slug: string, participantId: string) {
  return run(slug, async () => {
    const { room, me } = await guard(slug, { host: true });
    const target = await otherParticipant(room.id, me.id, participantId);
    await db.$transaction([
      // List options created by this person (while they were hosting) are kept.
      db.idea.updateMany({ where: { authorId: target.id, isOption: true }, data: { authorId: me.id } }),
      db.participant.delete({ where: { id: target.id } }),
    ]);
  });
}
