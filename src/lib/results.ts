// Pure vote counting logic (no I/O) — tested in results.test.ts.

export type VoteLike = { positive: boolean };

export type Score = { up: number; down: number; net: number };

export function scoreVotes(votes: VoteLike[]): Score {
  let up = 0;
  let down = 0;
  for (const v of votes) {
    if (v.positive) up++;
    else down++;
  }
  return { up, down, net: up - down };
}

/**
 * An idea is kept for the next round:
 * - requireNetPositive = true  → more "for" than "against"
 * - requireNetPositive = false → at least one "for"
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

/** Recap sort: best net score, then most "for", then creation order. */
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
