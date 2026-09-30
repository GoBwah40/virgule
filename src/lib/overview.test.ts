import { describe, expect, it } from "vitest";

import { bestAmountOverlap, bestDateOverlap, dayCoverage } from "@/lib/overview";

describe("dayCoverage", () => {
  it("counts the periods covering each day", () => {
    expect(
      dayCoverage([
        { start: "2027-06-10", end: "2027-06-12" },
        { start: "2027-06-12", end: "2027-06-13" },
      ]),
    ).toEqual([
      { date: "2027-06-10", count: 1 },
      { date: "2027-06-11", count: 1 },
      { date: "2027-06-12", count: 2 },
      { date: "2027-06-13", count: 1 },
    ]);
  });

  it("crosses month boundaries", () => {
    expect(dayCoverage([{ start: "2027-06-30", end: "2027-07-01" }]).map((d) => d.date)).toEqual([
      "2027-06-30",
      "2027-07-01",
    ]);
  });
});

describe("bestDateOverlap", () => {
  it("gives the slot common to all periods", () => {
    expect(
      bestDateOverlap([
        { start: "2027-06-10", end: "2027-06-14" },
        { start: "2027-06-12", end: "2027-06-16" },
        { start: "2027-06-11", end: "2027-06-15" },
      ]),
    ).toEqual({ start: "2027-06-12", end: "2027-06-14", count: 3, total: 3 });
  });

  it("without a common slot, gives the most shared one", () => {
    expect(
      bestDateOverlap([
        { start: "2027-06-05", end: "2027-06-07" },
        { start: "2027-06-12", end: "2027-06-14" },
        { start: "2027-06-13", end: "2027-06-16" },
      ]),
    ).toEqual({ start: "2027-06-13", end: "2027-06-14", count: 2, total: 3 });
  });

  it("says nothing with fewer than two periods", () => {
    expect(bestDateOverlap([{ start: "2027-06-05", end: "2027-06-07" }])).toBeNull();
  });
});

describe("bestAmountOverlap", () => {
  it("gives the zone compatible with all ranges", () => {
    expect(
      bestAmountOverlap([
        { min: 200, max: 400 },
        { min: 300, max: 500 },
        { min: 250, max: 450 },
      ]),
    ).toEqual({ start: 300, end: 400, count: 3, total: 3 });
  });

  it("without a common zone, gives the most shared one", () => {
    expect(
      bestAmountOverlap([
        { min: 100, max: 200 },
        { min: 300, max: 500 },
        { min: 350, max: 600 },
      ]),
    ).toEqual({ start: 350, end: 500, count: 2, total: 3 });
  });

  it("narrows the zone to one amount when ranges touch", () => {
    expect(bestAmountOverlap([{ min: 100, max: 300 }, { min: 300, max: 500 }])).toEqual({
      start: 300,
      end: 300,
      count: 2,
      total: 2,
    });
  });
});
