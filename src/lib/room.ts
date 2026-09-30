import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { Phase } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { compareByScore, isActiveInRound, isQualified, scoreVotes, type Score, voteProgress } from "@/lib/results";
import { phasePath } from "@/lib/phase-path";
import { getIdeaFormat } from "@/lib/idea-format";
import { describeIdea, type ThemeKind } from "@/lib/idea-value";
import { getParticipantToken } from "@/lib/session";

export type RoomContext =
  | { status: "not_found" }
  | { status: "expired" }
  | {
      status: "ok";
      room: {
        id: string;
        slug: string;
        name: string;
        phase: Phase;
        round: number;
        allowSelfVote: boolean;
        requireNetPositive: boolean;
        expiresAt: Date;
      };
      participants: { id: string; pseudo: string; isHost: boolean }[];
      /** Participant courant (null s'il n'a pas encore rejoint la room). */
      me: { id: string; pseudo: string; isHost: boolean } | null;
    };

/** Room + participant courant, mis en cache pour la durée d'une requête (layout + page). */
export const getRoomContext = cache(async (slug: string): Promise<RoomContext> => {
  const room = await db.room.findUnique({
    where: { slug },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
        select: { id: true, pseudo: true, isHost: true, token: true },
      },
    },
  });
  if (!room) return { status: "not_found" };
  if (room.expiresAt < new Date()) return { status: "expired" };

  const token = await getParticipantToken(slug);
  const meRow = token ? room.participants.find((p) => p.token === token) : undefined;

  return {
    status: "ok",
    room: {
      id: room.id,
      slug: room.slug,
      name: room.name,
      phase: room.phase,
      round: room.round,
      allowSelfVote: room.allowSelfVote,
      requireNetPositive: room.requireNetPositive,
      expiresAt: room.expiresAt,
    },
    // On ne renvoie jamais les tokens au-delà de ce module.
    participants: room.participants.map(({ id, pseudo, isHost }) => ({ id, pseudo, isHost })),
    me: meRow ? { id: meRow.id, pseudo: meRow.pseudo, isHost: meRow.isHost } : null,
  };
});

/** Prénom de la personne qui organise, pour les textes (« Camille prépare les sujets »). */
export const hostName = (participants: { pseudo: string; isHost: boolean }[]) =>
  participants.find((p) => p.isHost)?.pseudo ?? "";

export async function getThemes(roomId: string) {
  const themes = await db.theme.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: { id: true, title: true, description: true, kind: true, _count: { select: { ideas: true } } },
  });
  return themes.map(({ _count, ...theme }) => ({ ...theme, ideaCount: _count.ideas }));
}

// ─── Phase « idées & votes » ───────────────────────────────────────────────

export type VotingIdea = {
  id: string;
  content: string;
  isMine: boolean;
  /** Proposée pendant le tour courant (sinon : reprise d'un tour précédent). */
  isNew: boolean;
  myVote: boolean | null;
  canVote: boolean;
};

export type VotingTheme = {
  id: string;
  title: string;
  description: string | null;
  kind: ThemeKind;
  ideas: VotingIdea[];
};

/**
 * Vue de vote : seul le vote du participant courant est exposé.
 * Ni l'auteur, ni les votes des autres ne sont transmis au client (anonymat, pas de biais).
 */
export async function getVotingView(
  roomId: string,
  round: number,
  meId: string,
  allowSelfVote: boolean,
): Promise<VotingTheme[]> {
  const themes = await db.theme.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    include: {
      ideas: {
        orderBy: { createdAt: "asc" },
        include: { votes: { where: { round, participantId: meId }, select: { positive: true } } },
      },
    },
  });
  const format = await getIdeaFormat();

  return themes.map((theme) => ({
    id: theme.id,
    title: theme.title,
    description: theme.description,
    kind: theme.kind,
    ideas: theme.ideas
      .filter((idea) => isActiveInRound(idea, round))
      .map((idea) => {
        const isMine = idea.authorId === meId;
        return {
          id: idea.id,
          // Sujets typés : texte mis en forme à partir des dates / montants.
          content: describeIdea(theme.kind, idea, format),
          isMine,
          isNew: idea.createdRound === round,
          myVote: idea.votes[0]?.positive ?? null,
          canVote: allowSelfVote || !isMine,
        };
      }),
  }));
}

/**
 * Avancement des votes du tour, pour l'animateur (règle : `voteProgress`).
 * Seul un total est calculé, jamais qui a voté quoi.
 */
export async function getVoteProgress(roomId: string, round: number, allowSelfVote: boolean) {
  const [participants, ideas, votes] = await Promise.all([
    db.participant.findMany({ where: { roomId }, select: { id: true } }),
    db.idea.findMany({
      where: { roomId, createdRound: { lte: round }, OR: [{ eliminatedRound: null }, { eliminatedRound: { gt: round } }] },
      select: { authorId: true },
    }),
    db.vote.findMany({ where: { round, idea: { roomId } }, select: { participantId: true }, distinct: ["participantId"] }),
  ]);
  return voteProgress({
    participantIds: participants.map((p) => p.id),
    ideaAuthorIds: ideas.map((idea) => idea.authorId),
    voterIds: new Set(votes.map((v) => v.participantId)),
    allowSelfVote,
  });
}

// ─── Récapitulatif (tous les tours) ────────────────────────────────────────

type RecapIdea = {
  id: string;
  content: string;
  score: Score;
  qualified: boolean;
  isMine: boolean;
};

type RecapTheme = { id: string; title: string; description: string | null; ideas: RecapIdea[] };

export type RecapRound = { round: number; themes: RecapTheme[]; qualifiedCount: number; ideaCount: number };

/**
 * Résultats de chaque tour, du plus ancien au plus récent.
 * - Tours passés : une idée était retenue si elle a participé au tour suivant.
 * - Tour courant : la règle de qualification courante de la room s'applique.
 */
export async function getRecap(
  room: { id: string; round: number; requireNetPositive: boolean },
  meId: string | null,
): Promise<RecapRound[]> {
  const themes = await db.theme.findMany({
    where: { roomId: room.id },
    orderBy: { position: "asc" },
    include: {
      ideas: {
        orderBy: { createdAt: "asc" },
        include: { votes: { select: { round: true, positive: true } } },
      },
    },
  });

  const format = await getIdeaFormat();
  const rounds: RecapRound[] = [];
  for (let round = 1; round <= room.round; round++) {
    let qualifiedCount = 0;
    let ideaCount = 0;
    const roundThemes = themes.map((theme) => {
      const ideas = theme.ideas
        .filter((idea) => isActiveInRound(idea, round))
        .map((idea) => {
          const score = scoreVotes(idea.votes.filter((v) => v.round === round));
          const qualified =
            round < room.round
              ? isActiveInRound(idea, round + 1)
              : isQualified(score, room.requireNetPositive);
          ideaCount++;
          if (qualified) qualifiedCount++;
          return { id: idea.id, content: describeIdea(theme.kind, idea, format), score, qualified, isMine: idea.authorId === meId };
        })
        .sort((a, b) => compareByScore(a.score, b.score));
      return { id: theme.id, title: theme.title, description: theme.description, ideas };
    });
    rounds.push({ round, themes: roundThemes, qualifiedCount, ideaCount });
  }
  return rounds;
}

/**
 * Chargement commun des pages de phase : renvoie null si le layout affiche autre chose
 * (room introuvable, expirée, pas encore rejointe) et redirige si la phase a changé.
 */
export async function loadPhasePage(slug: string, allowed: Phase[]) {
  const ctx = await getRoomContext(slug);
  if (ctx.status !== "ok" || !ctx.me) return null;
  if (!allowed.includes(ctx.room.phase)) redirect(phasePath(slug, ctx.room.phase));
  return { room: ctx.room, me: ctx.me, participants: ctx.participants };
}

