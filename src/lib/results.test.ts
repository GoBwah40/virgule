import { describe, expect, it } from "vitest";

import { compareByScore, isActiveInRound, isQualified, scoreVotes, topQualified, voteProgress } from "@/lib/results";

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

describe("voteProgress", () => {
  const participantIds = ["camille", "sacha", "ines"];

  it("compte les participants ayant voté au moins une fois", () => {
    const res = voteProgress({ participantIds, ideaAuthorIds: ["camille"], voterIds: new Set(["sacha"]), allowSelfVote: true });
    expect(res).toEqual({ done: 1, total: 3 });
  });

  it("exclut ceux qui n'ont que leurs propres idées quand l'auto-vote est désactivé", () => {
    const res = voteProgress({ participantIds, ideaAuthorIds: ["camille"], voterIds: new Set(["sacha", "ines"]), allowSelfVote: false });
    expect(res).toEqual({ done: 2, total: 2 });
  });

  it("total nul quand il n'y a aucune idée", () => {
    expect(voteProgress({ participantIds, ideaAuthorIds: [], voterIds: new Set(), allowSelfVote: true })).toEqual({ done: 0, total: 0 });
  });
});

describe("topQualified", () => {
  const idea = (id: string, up: number, down: number, qualified = true) => ({
    id,
    score: { up, down, net: up - down },
    qualified,
  });

  it("repère les ex æquo en tête", () => {
    const top = topQualified([idea("a", 3, 1), idea("b", 3, 1), idea("c", 2, 1)]);
    expect(top.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("départage d'abord au nombre de « pour » à score net égal", () => {
    expect(topQualified([idea("a", 4, 2), idea("b", 2, 0)]).map((i) => i.id)).toEqual(["a"]);
  });

  it("ignore les idées écartées", () => {
    expect(topQualified([idea("a", 1, 1, false), idea("b", 1, 1, false)])).toEqual([]);
    expect(topQualified([idea("a", 2, 0), idea("b", 5, 0, false)]).map((i) => i.id)).toEqual(["a"]);
  });
});
