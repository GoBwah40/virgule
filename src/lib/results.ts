// Logique pure (sans I/O) de décompte des votes — testée dans results.test.ts.

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
 * Une idée est retenue pour le tour suivant :
 * - requireNetPositive = true  → plus de « pour » que de « contre »
 * - requireNetPositive = false → au moins un « pour »
 */
export function isQualified(score: Score, requireNetPositive: boolean): boolean {
  return requireNetPositive ? score.net > 0 : score.up >= 1;
}

/** Une idée participe au tour `round` si elle existait et n'avait pas été éliminée. */
export function isActiveInRound(
  idea: { createdRound: number; eliminatedRound: number | null },
  round: number,
): boolean {
  return idea.createdRound <= round && (idea.eliminatedRound === null || idea.eliminatedRound > round);
}

/** Tri du récap : meilleur score net, puis plus de « pour », puis ordre de création. */
export function compareByScore(a: Score, b: Score): number {
  return b.net - a.net || b.up - a.up;
}

/**
 * Avancement des votes : parmi les participants qui ont au moins une idée sur laquelle
 * voter, combien ont voté au moins une fois. Ceux qui n'ont rien à voter (seulement
 * leurs propres idées, auto-vote désactivé) sont exclus pour ne pas bloquer le total.
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
 * Idées en tête d'un sujet : les idées retenues au meilleur score (même score net et même
 * nombre de « pour »). Plusieurs idées = ex æquo, que l'on peut départager par un tour dédié.
 */
export function topQualified<T extends { score: Score; qualified: boolean }>(ideas: T[]): T[] {
  const qualified = ideas.filter((idea) => idea.qualified).sort((a, b) => compareByScore(a.score, b.score));
  if (qualified.length === 0) return [];
  return qualified.filter((idea) => compareByScore(idea.score, qualified[0].score) === 0);
}
