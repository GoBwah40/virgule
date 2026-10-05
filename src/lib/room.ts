import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { Phase } from "@/generated/prisma/enums";
import { roomCapacity } from "@/lib/config";
import { db } from "@/lib/db";
import { compareByScore, isActiveInRound, isQualified, scoreVotes, type Score, topQualified, voteProgress } from "@/lib/results";
import { phasePath } from "@/lib/phase-path";
import { getIdeaFormat } from "@/lib/idea-format";
import { describeIdea, readChoiceOptions, type ThemeKind } from "@/lib/idea-value";
import { bestAmountOverlap, bestDateOverlap, type Overlap } from "@/lib/overview";
import { getParticipantToken, getScreenToken } from "@/lib/session";

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
        ideasTimerMinutes: number | null;
        phaseEndsAt: Date | null;
        tiebreak: boolean;
        /** Number of seats (size chosen by the host). */
        capacity: number;
        /** A room screen is paired (its secret never leaves this module). */
        screenPaired: boolean;
      };
      participants: { id: string; pseudo: string; isHost: boolean }[];
      /** Current participant (null if they have not joined the room yet). */
      me: { id: string; pseudo: string; isHost: boolean } | null;
      /** This browser is the room screen paired by the host (not a participant). */
      isScreen: boolean;
    };

/** Room + current participant, cached for the duration of a request (layout + page). */
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

  const [token, screenToken] = await Promise.all([getParticipantToken(slug), getScreenToken(slug)]);
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
      ideasTimerMinutes: room.ideasTimerMinutes,
      phaseEndsAt: room.phaseEndsAt,
      tiebreak: room.tiebreak,
      capacity: roomCapacity(room),
      screenPaired: room.screenToken !== null,
    },
    // Tokens never leave this module.
    participants: room.participants.map(({ id, pseudo, isHost }) => ({ id, pseudo, isHost })),
    me: meRow ? { id: meRow.id, pseudo: meRow.pseudo, isHost: meRow.isHost } : null,
    isScreen: !!screenToken && screenToken === room.screenToken,
  };
});

/** First name of the host, for texts ("Camille is preparing the topics"). */
export const hostName = (participants: { pseudo: string; isHost: boolean }[]) =>
  participants.find((p) => p.isHost)?.pseudo ?? "";

export async function getThemes(roomId: string) {
  const themes = await db.theme.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      kind: true,
      options: true,
      allowOtherIdeas: true,
      singleChoice: true,
      maxVotes: true,
      _count: { select: { ideas: true } },
    },
  });
  return themes.map(({ _count, options, ...theme }) => ({
    ...theme,
    options: readChoiceOptions(options),
    ideaCount: _count.ideas,
  }));
}

export type ThemeSuggestionView = { id: string; title: string; description: string | null };

/**
 * Topic suggestions waiting for the host: all of them for the host, only their own for
 * the others. The author is never sent (the host sees the topic, not who suggested it).
 */
export async function getThemeSuggestions(roomId: string, me: { id: string; isHost: boolean }): Promise<ThemeSuggestionView[]> {
  return db.themeSuggestion.findMany({
    where: { roomId, ...(me.isHost ? {} : { authorId: me.id }) },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, description: true },
  });
}

// ─── "Ideas & votes" phase ─────────────────────────────────────────────────

export type VotingIdea = {
  id: string;
  content: string;
  isMine: boolean;
  /** Submitted during the current round (otherwise: carried over from a previous round). */
  isNew: boolean;
  myVote: boolean | null;
  canVote: boolean;
  /** Removable by the current participant (their own idea this round, or an option if hosting). */
  canDelete: boolean;
  /** List option, set by the host. */
  isOption: boolean;
  /** "Place" topics: text to search on the map. */
  mapQuery: string | null;
};

export type VotingTheme = {
  id: string;
  title: string;
  description: string | null;
  kind: ThemeKind;
  /** False for a closed list: only the options can be voted on. */
  acceptsIdeas: boolean;
  /** Single-answer list: each participant picks one idea, with no "against". */
  singleChoice: boolean;
  /** Maximum "for" votes per participant in this topic (null = no limit). */
  maxVotes: number | null;
  ideas: VotingIdea[];
};

/**
 * Voting view: only the current participant's vote is exposed.
 * Neither the author nor the others' votes are sent to the client (anonymity, no bias).
 */
export async function getVotingView(
  roomId: string,
  round: number,
  me: { id: string; isHost: boolean },
  allowSelfVote: boolean,
): Promise<VotingTheme[]> {
  const meId = me.id;
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
    acceptsIdeas: theme.kind !== "CHOICE" || theme.allowOtherIdeas,
    singleChoice: theme.kind === "CHOICE" && theme.singleChoice,
    maxVotes: theme.maxVotes,
    ideas: theme.ideas
      .filter((idea) => isActiveInRound(idea, round))
      .map((idea) => {
        // A list option belongs to nobody: anyone can vote on it, even without self-voting.
        const isMine = !idea.isOption && idea.authorId === meId;
        const isNew = idea.createdRound === round;
        return {
          id: idea.id,
          // Typed topics: text formatted from the dates / amounts.
          content: describeIdea(theme.kind, idea, format),
          isMine,
          isNew,
          myVote: idea.votes[0]?.positive ?? null,
          canVote: allowSelfVote || !isMine,
          canDelete: isNew && (idea.isOption ? me.isHost : isMine),
          isOption: idea.isOption,
          mapQuery: theme.kind === "PLACE" ? idea.content : null,
        };
      }),
  }));
}

/**
 * Vote progress for the round, for the host (rule: `voteProgress`).
 * Only a total is computed, never who voted for what.
 */
export async function getVoteProgress(roomId: string, round: number, allowSelfVote: boolean) {
  const [participants, ideas, votes] = await Promise.all([
    db.participant.findMany({ where: { roomId }, select: { id: true } }),
    db.idea.findMany({
      where: { roomId, createdRound: { lte: round }, OR: [{ eliminatedRound: null }, { eliminatedRound: { gt: round } }] },
      select: { authorId: true, isOption: true },
    }),
    db.vote.findMany({ where: { round, idea: { roomId } }, select: { participantId: true }, distinct: ["participantId"] }),
  ]);
  return voteProgress({
    participantIds: participants.map((p) => p.id),
    // List options: no author, everyone can vote on them.
    ideaAuthorIds: ideas.map((idea) => (idea.isOption ? "" : idea.authorId)),
    voterIds: new Set(votes.map((v) => v.participantId)),
    allowSelfVote,
  });
}

// ─── Recap (all rounds) ────────────────────────────────────────────────────

type RecapIdea = {
  id: string;
  content: string;
  score: Score;
  qualified: boolean;
  /** Tied for the lead of the topic with at least one other kept idea. */
  tied: boolean;
  isMine: boolean;
  mapQuery: string | null;
};

/** Overview of a "Period" or "Range" topic: where the kept ideas overlap. */
export type RecapOverview =
  | { type: "dates"; periods: { start: string; end: string }[]; best: Overlap<string> }
  | { type: "amounts"; ranges: { min: number; max: number }[]; best: Overlap<number> };

type RecapTheme = {
  id: string;
  title: string;
  description: string | null;
  kind: ThemeKind;
  overview: RecapOverview | null;
  ideas: RecapIdea[];
};

export type RecapRound = {
  round: number;
  themes: RecapTheme[];
  qualifiedCount: number;
  ideaCount: number;
  /** Number of topics whose leading ideas are tied. */
  tiedThemeCount: number;
};

/**
 * Results of each round, oldest first.
 * - Past rounds: an idea was kept if it took part in the next round.
 * - Current round: the room's current qualification rule applies.
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
    let tiedThemeCount = 0;
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
          return {
            id: idea.id,
            content: describeIdea(theme.kind, idea, format),
            score,
            qualified,
            tied: false,
            isMine: !idea.isOption && idea.authorId === meId,
            mapQuery: theme.kind === "PLACE" ? idea.content : null,
            fields: idea,
          };
        })
        .sort((a, b) => compareByScore(a.score, b.score));
      const top = topQualified(ideas);
      if (top.length > 1) {
        tiedThemeCount++;
        for (const idea of top) idea.tied = true;
      }
      return {
        id: theme.id,
        title: theme.title,
        description: theme.description,
        kind: theme.kind,
        overview: overviewOf(theme.kind, ideas.filter((idea) => idea.qualified).map((idea) => idea.fields)),
        ideas: ideas.map(({ fields: _, ...idea }) => idea),
      };
    });
    rounds.push({ round, themes: roundThemes, qualifiedCount, ideaCount, tiedThemeCount });
  }
  return rounds;
}

function overviewOf(
  kind: ThemeKind,
  retained: { dateStart: string | null; dateEnd: string | null; amountMin: number | null; amountMax: number | null }[],
): RecapOverview | null {
  if (kind === "DATE_RANGE") {
    const periods = retained.flatMap((i) => (i.dateStart && i.dateEnd ? [{ start: i.dateStart, end: i.dateEnd }] : []));
    const best = bestDateOverlap(periods);
    return best && { type: "dates", periods, best };
  }
  if (kind === "AMOUNT_RANGE") {
    const ranges = retained.flatMap((i) => (i.amountMin !== null && i.amountMax !== null ? [{ min: i.amountMin, max: i.amountMax }] : []));
    const best = bestAmountOverlap(ranges);
    return best && { type: "amounts", ranges, best };
  }
  return null;
}

/**
 * Shared loading for phase pages: returns null if the layout shows something else
 * (room not found, expired, not joined yet) and redirects if the phase has changed.
 */
export async function loadPhasePage(slug: string, allowed: Phase[]) {
  const ctx = await getRoomContext(slug);
  if (ctx.status !== "ok" || !ctx.me) return null;
  if (!allowed.includes(ctx.room.phase)) redirect(phasePath(slug, ctx.room.phase));
  return { room: ctx.room, me: ctx.me, participants: ctx.participants };
}


// ─── Presentation screen (host or paired screen, seen by the whole room) ────

type PresentationTopic = { id: string; title: string; description: string | null; kind: ThemeKind };

export type PresentationView =
  | { step: "THEMES"; topics: PresentationTopic[] }
  | {
      step: "IDEAS";
      topics: (PresentationTopic & { ideas: { id: string; content: string }[] })[];
      progress: { done: number; total: number };
      endsAt: Date | null;
    }
  | {
      step: "RECAP";
      closed: boolean;
      topics: (PresentationTopic & {
        ideas: { id: string; content: string; score: Score; qualified: boolean; leading: boolean }[];
      })[];
    };

/**
 * What the room screen shows, built for the group rather than taken from the host's view: never
 * whose idea it is (no "Your idea", nothing removable), no score nor vote while ideas are open
 * (only how many people have voted), and in the recap the same totals every participant sees.
 */
export async function getPresentationView(room: {
  id: string;
  phase: Phase;
  round: number;
  allowSelfVote: boolean;
  requireNetPositive: boolean;
  phaseEndsAt: Date | null;
}): Promise<PresentationView> {
  const topicOf = (theme: PresentationTopic): PresentationTopic => ({
    id: theme.id,
    title: theme.title,
    description: theme.description,
    kind: theme.kind,
  });

  if (room.phase === "THEMES") {
    return { step: "THEMES", topics: (await getThemes(room.id)).map(topicOf) };
  }

  if (room.phase === "IDEAS") {
    const [themes, progress, format] = await Promise.all([
      db.theme.findMany({
        where: { roomId: room.id },
        orderBy: { position: "asc" },
        // Nothing about authors or votes is read: it cannot leak.
        include: {
          ideas: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              dateStart: true,
              dateEnd: true,
              amountMin: true,
              amountMax: true,
              createdRound: true,
              eliminatedRound: true,
            },
          },
        },
      }),
      getVoteProgress(room.id, room.round, room.allowSelfVote),
      getIdeaFormat(),
    ]);
    return {
      step: "IDEAS",
      topics: themes.map((theme) => ({
        ...topicOf(theme),
        ideas: theme.ideas
          .filter((idea) => isActiveInRound(idea, room.round))
          .map((idea) => ({ id: idea.id, content: describeIdea(theme.kind, idea, format) })),
      })),
      progress,
      endsAt: room.phaseEndsAt,
    };
  }

  // Recap: the current round, as everyone sees it (nobody is "me" on the room screen).
  const rounds = await getRecap(room, null);
  return {
    step: "RECAP",
    closed: room.phase === "CLOSED",
    topics: rounds[rounds.length - 1].themes.map((theme) => {
      const leaders = new Set(topQualified(theme.ideas).map((idea) => idea.id));
      return {
        ...topicOf(theme),
        ideas: theme.ideas.map((idea) => ({
          id: idea.id,
          content: idea.content,
          score: idea.score,
          qualified: idea.qualified,
          leading: leaders.has(idea.id),
        })),
      };
    }),
  };
}
