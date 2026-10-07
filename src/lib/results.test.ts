import { describe, expect, it } from "vitest";

import { compareByScore, isActiveInRound, isQualified, keptInPastRound, pointsLeft, roundResults, scoreVotes, topQualified, voteProgress, } from "@/lib/results";

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

describe("points topics", () => {
  const given = (...points: number[]) => points.map((p) => ({ positive: true, points: p }));

  it("scores an idea by its total points, with nothing against", () => {
    expect(scoreVotes(given(3, 1, 5))).toEqual({ up: 9, down: 0, net: 9 });
    // A for / against vote counts one, as before.
    expect(scoreVotes([{ positive: true, points: null }, { positive: false }])).toEqual({ up: 1, down: 1, net: 0 });
  });

  it("keeps an idea with at least one point, whichever rule is chosen", () => {
    for (const requireNetPositive of [true, false]) {
      expect(isQualified(scoreVotes(given(1)), requireNetPositive)).toBe(true);
      expect(isQualified(scoreVotes([]), requireNetPositive)).toBe(false);
    }
  });

  it("ranks by total points and spots ties for a tiebreak round", () => {
    const idea = (id: string, ...points: number[]) => ({ id, score: scoreVotes(given(...points)), qualified: points.length > 0 });
    const ideas = [idea("a", 2), idea("b", 3, 2), idea("c", 4, 1), idea("d")];
    expect([...ideas].sort((x, y) => compareByScore(x.score, y.score)).map((i) => i.id)).toEqual(["b", "c", "a", "d"]);
    expect(topQualified(ideas).map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("counts the points left in the budget", () => {
    expect(pointsLeft(5, [2, 1, 0])).toBe(2);
    expect(pointsLeft(5, [])).toBe(5);
    expect(pointsLeft(3, [3])).toBe(0);
    expect(pointsLeft(3, [4])).toBe(0);
  });
});

describe("frozen round results", () => {
  const points = (...given: number[]) => given.map((p) => ({ positive: true, points: p }));

  it("records whether each idea was kept, under the rule in force", () => {
    const ideas = [
      { id: "pizza", votes: votes(2, 0) },
      { id: "sushi", votes: votes(1, 1) },
      { id: "tacos", votes: [] },
    ];
    expect(roundResults(ideas, true)).toEqual([
      { ideaId: "pizza", qualified: true },
      { ideaId: "sushi", qualified: false },
      { ideaId: "tacos", qualified: false },
    ]);
    expect(roundResults(ideas, false).map((r) => r.qualified)).toEqual([true, true, false]);
  });

  it("keeps any idea with points in a points topic", () => {
    const ideas = [
      { id: "a", votes: points(1) },
      { id: "b", votes: [] },
    ];
    expect(roundResults(ideas, true).map((r) => r.qualified)).toEqual([true, false]);
  });

  it("a tiebreak does not rewrite the kept ideas of the round before", () => {
    // Round 1: Pizza 2–0 and Sushi 2–0 tied, Tacos 1–0 kept too. The tiebreak (round 2) only keeps
    // Pizza and Sushi: Tacos is set aside from round 2, yet it was kept in round 1.
    const round1 = roundResults(
      [
        { id: "pizza", votes: votes(2, 0) },
        { id: "sushi", votes: votes(2, 0) },
        { id: "tacos", votes: votes(1, 0) },
      ],
      true,
    );
    const tacos = { createdRound: 1, eliminatedRound: 2 };
    expect(keptInPastRound(round1.find((r) => r.ideaId === "tacos")?.qualified, tacos, 1)).toBe(true);
    // Without the frozen result, it would read as dropped.
    expect(keptInPastRound(undefined, tacos, 1)).toBe(false);
  });

  it("a frozen result wins over what the next round did", () => {
    // Dropped in round 1 under the rule then, whatever happened after.
    expect(keptInPastRound(false, { createdRound: 1, eliminatedRound: null }, 1)).toBe(false);
  });

  it("falls back to the next round for rounds left before results were frozen", () => {
    expect(keptInPastRound(undefined, { createdRound: 1, eliminatedRound: null }, 1)).toBe(true);
    expect(keptInPastRound(undefined, { createdRound: 1, eliminatedRound: 2 }, 1)).toBe(false);
  });
});
