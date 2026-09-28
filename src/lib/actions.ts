"use server";

import { randomBytes } from "node:crypto";

import { customAlphabet } from "nanoid";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { Phase } from "@/generated/prisma/enums";
import { LIMITS, MAX_PARTICIPANTS, MAX_THEMES, ROOM_TTL_DAYS } from "@/lib/config";
import { db } from "@/lib/db";
import { notifyRoom } from "@/lib/realtime/server";
import { isActiveInRound, isQualified, scoreVotes } from "@/lib/results";
import { getRoomContext, phasePath } from "@/lib/room";
import { setParticipantToken } from "@/lib/session";

// Clés de messages i18n (namespace « errors » dans messages/fr.json).
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
  | "unknown";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };

const fail = (error: ActionError): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

// Slug lisible et non devinable : 10 caractères sans ambiguïté (pas de 0/O, 1/l…).
const newSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);
const newToken = () => randomBytes(24).toString("base64url");

const text = (max: number) => z.string().trim().min(1).max(max);

class ActionFailure extends Error {
  constructor(public readonly code: ActionError) {
    super(code);
  }
}

/** Vérifie que l'appelant a rejoint la room (et, si demandé, qu'il est animateur / dans la bonne phase). */
async function guard(slug: string, opts: { host?: boolean; phase?: Phase } = {}) {
  const ctx = await getRoomContext(slug);
  if (ctx.status === "not_found") throw new ActionFailure("roomNotFound");
  if (ctx.status === "expired") throw new ActionFailure("roomExpired");
  if (!ctx.me) throw new ActionFailure("notJoined");
  if (opts.host && !ctx.me.isHost) throw new ActionFailure("notHost");
  if (opts.phase && ctx.room.phase !== opts.phase) throw new ActionFailure("wrongPhase");
  return { room: ctx.room, me: ctx.me };
}

/** Enveloppe commune : traduit les erreurs, rafraîchit l'appelant et notifie les autres. */
async function run(slug: string, fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    console.error("[action]", error);
    return fail("unknown");
  }
  await notifyRoom(slug);
  refresh();
  return ok();
}

// ─── Création / accès ──────────────────────────────────────────────────────

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
      // Recompte après insertion : protège contre deux arrivées simultanées sur la dernière place.
      const count = await tx.participant.count({ where: { roomId: ctx.room.id } });
      if (count > MAX_PARTICIPANTS) throw new ActionFailure("roomFull");
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.code);
    // Contrainte d'unicité (roomId, pseudo) violée par une arrivée concurrente.
    return fail("pseudoTaken");
  }

  await setParticipantToken(slug, token);
  await notifyRoom(slug);
  redirect(phasePath(slug, ctx.room.phase));
}

// ─── Phase 1 : thèmes (animateur) ──────────────────────────────────────────

const themeSchema = z.object({
  title: text(LIMITS.themeTitle),
  description: z.string().trim().max(LIMITS.themeDescription).optional(),
});

export async function addTheme(slug: string, input: { title: string; description?: string }) {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const count = await db.theme.count({ where: { roomId: room.id } });
    if (count >= MAX_THEMES) throw new ActionFailure("tooManyThemes");
    const last = await db.theme.findFirst({ where: { roomId: room.id }, orderBy: { position: "desc" } });
    await db.theme.create({
      data: {
        roomId: room.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        position: (last?.position ?? -1) + 1,
      },
    });
  });
}

export async function updateTheme(
  slug: string,
  themeId: string,
  input: { title: string; description?: string },
) {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    await db.theme.updateMany({
      where: { id: themeId, roomId: room.id },
      data: { title: parsed.data.title, description: parsed.data.description || null },
    });
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
    const { room } = await guard(slug, { host: true, phase: "THEMES" });
    const count = await db.theme.count({ where: { roomId: room.id } });
    if (count === 0) throw new ActionFailure("noThemes");
    await db.room.update({ where: { id: room.id }, data: { phase: "IDEAS" } });
  });
}

// ─── Phase 2 : idées & votes ───────────────────────────────────────────────

export async function addIdea(slug: string, themeId: string, input: { content: string }) {
  const parsed = z.object({ content: text(LIMITS.idea) }).safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const theme = await db.theme.findFirst({ where: { id: themeId, roomId: room.id } });
    if (!theme) throw new ActionFailure("invalidInput");
    await db.idea.create({
      data: {
        roomId: room.id,
        themeId,
        authorId: me.id,
        content: parsed.data.content,
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
    // Une idée reprise d'un tour précédent ne peut plus être retirée par son auteur.
    if (idea.authorId !== me.id || idea.createdRound !== room.round) throw new ActionFailure("notAuthor");
    await db.idea.delete({ where: { id: idea.id } });
  });
}

/** `positive = null` retire le vote. */
export async function castVote(slug: string, ideaId: string, positive: boolean | null) {
  return run(slug, async () => {
    const { room, me } = await guard(slug, { phase: "IDEAS" });
    const idea = await db.idea.findFirst({ where: { id: ideaId, roomId: room.id } });
    if (!idea || !isActiveInRound(idea, room.round)) throw new ActionFailure("ideaNotFound");
    if (!room.allowSelfVote && idea.authorId === me.id) throw new ActionFailure("selfVoteForbidden");

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

/** Retour à la déclaration des thèmes : idées et votes sont conservés. */
export async function backToThemes(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    await db.room.update({ where: { id: room.id }, data: { phase: "THEMES" } });
  });
}

export async function goToRecap(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "IDEAS" });
    await db.room.update({ where: { id: room.id }, data: { phase: "RECAP" } });
  });
}

// ─── Phase 3 : récapitulatif (animateur) ───────────────────────────────────

export async function reopenVoting(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({ where: { id: room.id }, data: { phase: "IDEAS" } });
  });
}

export async function setRequireNetPositive(slug: string, value: boolean) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({ where: { id: room.id }, data: { requireNetPositive: value } });
  });
}

/** Élimine les idées non retenues puis ouvre le tour suivant (votes remis à zéro). */
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
      db.room.update({ where: { id: room.id }, data: { round: nextRound, phase: "IDEAS" } }),
    ]);
  });
}

export async function closeSession(slug: string) {
  return run(slug, async () => {
    const { room } = await guard(slug, { host: true, phase: "RECAP" });
    await db.room.update({ where: { id: room.id }, data: { phase: "CLOSED" } });
  });
}
