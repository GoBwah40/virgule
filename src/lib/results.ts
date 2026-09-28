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
