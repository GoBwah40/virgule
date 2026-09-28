import { describe, expect, it } from "vitest";

import { compareByScore, isActiveInRound, isQualified, scoreVotes } from "@/lib/results";

const votes = (up: number, down: number) => [
  ...Array.from({ length: up }, () => ({ positive: true })),
  ...Array.from({ length: down }, () => ({ positive: false })),
];

describe("scoreVotes", () => {
  it("compte pour, contre et score net", () => {
    expect(scoreVotes(votes(3, 1))).toEqual({ up: 3, down: 1, net: 2 });
    expect(scoreVotes([])).toEqual({ up: 0, down: 0, net: 0 });
  });
});

describe("isQualified", () => {
  it("score positif exigé : pour > contre", () => {
    expect(isQualified(scoreVotes(votes(2, 1)), true)).toBe(true);
    expect(isQualified(scoreVotes(votes(1, 1)), true)).toBe(false);
    expect(isQualified(scoreVotes(votes(1, 4)), true)).toBe(false);
  });

  it("règle souple : un seul « pour » suffit", () => {
    expect(isQualified(scoreVotes(votes(1, 4)), false)).toBe(true);
    expect(isQualified(scoreVotes(votes(0, 0)), false)).toBe(false);
  });
});

describe("isActiveInRound", () => {
  it("prend en compte le tour de création et d'élimination", () => {
    const idea = { createdRound: 1, eliminatedRound: 3 };
    expect(isActiveInRound(idea, 1)).toBe(true);
    expect(isActiveInRound(idea, 2)).toBe(true);
    expect(isActiveInRound(idea, 3)).toBe(false);
    expect(isActiveInRound({ createdRound: 2, eliminatedRound: null }, 1)).toBe(false);
    expect(isActiveInRound({ createdRound: 2, eliminatedRound: null }, 5)).toBe(true);
  });
});

describe("compareByScore", () => {
  it("classe par score net puis par nombre de « pour »", () => {
    const scores = [scoreVotes(votes(1, 0)), scoreVotes(votes(3, 2)), scoreVotes(votes(4, 1))];
    expect(scores.sort(compareByScore).map((s) => s.up)).toEqual([4, 3, 1]);
  });
});
