import { describe, expect, it } from "vitest";

import { compareByScore, isActiveInRound, isQualified, scoreVotes, topQualified, voteProgress } from "@/lib/results";

const votes = (up: number, down: number) => [
  ...Array.from({ length: up }, () => ({ positive: true })),
  ...Array.from({ length: down }, () => ({ positive: false })),
];

describe("scoreVotes", () => {
  it("counts for, against and net score", () => {
    expect(scoreVotes(votes(3, 1))).toEqual({ up: 3, down: 1, net: 2 });
    expect(scoreVotes([])).toEqual({ up: 0, down: 0, net: 0 });
  });
});

describe("isQualified", () => {
  it("positive score required: for > against", () => {
    expect(isQualified(scoreVotes(votes(2, 1)), true)).toBe(true);
    expect(isQualified(scoreVotes(votes(1, 1)), true)).toBe(false);
    expect(isQualified(scoreVotes(votes(1, 4)), true)).toBe(false);
  });

  it("lenient rule: a single \"for\" is enough", () => {
    expect(isQualified(scoreVotes(votes(1, 4)), false)).toBe(true);
    expect(isQualified(scoreVotes(votes(0, 0)), false)).toBe(false);
  });
});

describe("isActiveInRound", () => {
  it("accounts for the creation and elimination rounds", () => {
    const idea = { createdRound: 1, eliminatedRound: 3 };
    expect(isActiveInRound(idea, 1)).toBe(true);
    expect(isActiveInRound(idea, 2)).toBe(true);
    expect(isActiveInRound(idea, 3)).toBe(false);
    expect(isActiveInRound({ createdRound: 2, eliminatedRound: null }, 1)).toBe(false);
    expect(isActiveInRound({ createdRound: 2, eliminatedRound: null }, 5)).toBe(true);
  });
});

describe("compareByScore", () => {
  it("sorts by net score, then by number of \"for\"", () => {
    const scores = [scoreVotes(votes(1, 0)), scoreVotes(votes(3, 2)), scoreVotes(votes(4, 1))];
    expect(scores.sort(compareByScore).map((s) => s.up)).toEqual([4, 3, 1]);
  });
});

describe("voteProgress", () => {
  const participantIds = ["camille", "sacha", "ines"];

  it("counts participants who voted at least once", () => {
    const res = voteProgress({ participantIds, ideaAuthorIds: ["camille"], voterIds: new Set(["sacha"]), allowSelfVote: true });
    expect(res).toEqual({ done: 1, total: 3 });
  });

  it("excludes those with only their own ideas when self-voting is disabled", () => {
    const res = voteProgress({ participantIds, ideaAuthorIds: ["camille"], voterIds: new Set(["sacha", "ines"]), allowSelfVote: false });
    expect(res).toEqual({ done: 2, total: 2 });
  });

  it("zero total when there are no ideas", () => {
    expect(voteProgress({ participantIds, ideaAuthorIds: [], voterIds: new Set(), allowSelfVote: true })).toEqual({ done: 0, total: 0 });
  });
});

describe("topQualified", () => {
  const idea = (id: string, up: number, down: number, qualified = true) => ({
    id,
    score: { up, down, net: up - down },
    qualified,
  });

  it("spots ties for the lead", () => {
    const top = topQualified([idea("a", 3, 1), idea("b", 3, 1), idea("c", 2, 1)]);
    expect(top.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("breaks equal net scores by number of \"for\" first", () => {
    expect(topQualified([idea("a", 4, 2), idea("b", 2, 0)]).map((i) => i.id)).toEqual(["a"]);
  });

  it("ignores dropped ideas", () => {
    expect(topQualified([idea("a", 1, 1, false), idea("b", 1, 1, false)])).toEqual([]);
    expect(topQualified([idea("a", 2, 0), idea("b", 5, 0, false)]).map((i) => i.id)).toEqual(["a"]);
  });
});
