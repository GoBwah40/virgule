// Pure vote counting logic (no I/O) — tested in results.test.ts.

/** `points`: a vote in a points topic (null or missing for a for / against vote). */
export type VoteLike = { positive: boolean; points?: number | null };

/**
 * `up`: "for" votes, or the total points in a points topic; `down`: "against" votes (always 0
 * in a points topic); `net`: up − down, so a points topic ranks by its total points.
 */
export type Score = { up: number; down: number; net: number };

export function scoreVotes(votes: VoteLike[]): Score {
  let up = 0;
  let down = 0;
  for (const v of votes) {
    if (v.positive) up += v.points ?? 1;
    else down++;
  }
  return { up, down, net: up - down };
}

/**
 * An idea is kept for the next round:
 * - requireNetPositive = true  → more "for" than "against"
 * - requireNetPositive = false → at least one "for"
 *
 * Points topics have no "against": both rules come down to the same one, at least one point.
 */
export function isQualified(score: Score, requireNetPositive: boolean): boolean {
  return requireNetPositive ? score.net > 0 : score.up >= 1;
}

/** An idea takes part in round `round` if it existed and had not been eliminated. */
export function isActiveInRound(
  idea: { createdRound: number; eliminatedRound: number | null },
  round: number,
): boolean {
  return idea.createdRound <= round && (idea.eliminatedRound === null || idea.eliminatedRound > round);
}

/**
 * Result of a round as the group last saw it in its recap: whether each of its ideas was kept,
 * under the rule in force. Frozen when the round is left (next round or tiebreak), so later
 * rounds never rewrite it: a tiebreak sets aside ideas that were kept without leading.
 */
export function roundResults(
  ideas: { id: string; votes: VoteLike[] }[],
  requireNetPositive: boolean,
): { ideaId: string; qualified: boolean }[] {
  return ideas.map((idea) => ({ ideaId: idea.id, qualified: isQualified(scoreVotes(idea.votes), requireNetPositive) }));
}

/**
 * Was an idea kept in a past round: its frozen result, or, for a round left before results were
 * frozen (`frozen` undefined), whether it took part in the next round.
 */
export function keptInPastRound(
  frozen: boolean | undefined,
  idea: { createdRound: number; eliminatedRound: number | null },
  round: number,
): boolean {
  return frozen ?? isActiveInRound(idea, round + 1);
}

/** Recap sort: best net score, then most "for", then creation order (points topics: most points). */
export function compareByScore(a: Score, b: Score): number {
  return b.net - a.net || b.up - a.up;
}

/**
 * Vote progress: among participants who have at least one idea to vote on, how many
 * have voted at least once. Those with nothing to vote on (only their own ideas,
 * self-voting disabled) are excluded so as not to block the total.
 */
export function voteProgress(input: {
  participantIds: string[];
  ideaAuthorIds: string[];
  voterIds: Set<string>;
  allowSelfVote: boolean;
}): { done: number; total: number } {
  const concerned = input.participantIds.filter((id) =>
    input.ideaAuthorIds.some((author) => input.allowSelfVote || author !== id),
  );
  return { done: concerned.filter((id) => input.voterIds.has(id)).length, total: concerned.length };
}

/**
 * Leading ideas of a topic: the kept ideas with the best score (same net score and same
 * number of "for"). Several ideas = a tie, which a dedicated round can break.
 */
export function topQualified<T extends { score: Score; qualified: boolean }>(ideas: T[]): T[] {
  const qualified = ideas.filter((idea) => idea.qualified).sort((a, b) => compareByScore(a.score, b.score));
  if (qualified.length === 0) return [];
  return qualified.filter((idea) => compareByScore(idea.score, qualified[0].score) === 0);
}

/** Points left to a participant in a points topic, from the points they gave its ideas. */
export function pointsLeft(budget: number, given: number[]): number {
  return Math.max(0, budget - given.reduce((sum, points) => sum + points, 0));
}
