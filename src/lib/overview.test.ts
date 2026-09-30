import { describe, expect, it } from "vitest";

import { bestAmountOverlap, bestDateOverlap, dayCoverage } from "@/lib/overview";

describe("dayCoverage", () => {
  it("compte les périodes qui couvrent chaque jour", () => {
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

  it("traverse les changements de mois", () => {
    expect(dayCoverage([{ start: "2027-06-30", end: "2027-07-01" }]).map((d) => d.date)).toEqual([
      "2027-06-30",
      "2027-07-01",
    ]);
  });
});

describe("bestDateOverlap", () => {
  it("donne le créneau commun à toutes les périodes", () => {
    expect(
      bestDateOverlap([
        { start: "2027-06-10", end: "2027-06-14" },
        { start: "2027-06-12", end: "2027-06-16" },
        { start: "2027-06-11", end: "2027-06-15" },
      ]),
    ).toEqual({ start: "2027-06-12", end: "2027-06-14", count: 3, total: 3 });
  });

  it("sans créneau commun, donne le plus partagé", () => {
    expect(
      bestDateOverlap([
        { start: "2027-06-05", end: "2027-06-07" },
        { start: "2027-06-12", end: "2027-06-14" },
        { start: "2027-06-13", end: "2027-06-16" },
      ]),
    ).toEqual({ start: "2027-06-13", end: "2027-06-14", count: 2, total: 3 });
  });

  it("ne dit rien avec moins de deux périodes", () => {
    expect(bestDateOverlap([{ start: "2027-06-05", end: "2027-06-07" }])).toBeNull();
  });
});

describe("bestAmountOverlap", () => {
  it("donne la zone compatible avec toutes les fourchettes", () => {
    expect(
      bestAmountOverlap([
        { min: 200, max: 400 },
        { min: 300, max: 500 },
        { min: 250, max: 450 },
      ]),
    ).toEqual({ start: 300, end: 400, count: 3, total: 3 });
  });

  it("sans zone commune, donne la plus partagée", () => {
    expect(
      bestAmountOverlap([
        { min: 100, max: 200 },
        { min: 300, max: 500 },
        { min: 350, max: 600 },
      ]),
    ).toEqual({ start: 350, end: 500, count: 2, total: 3 });
  });

  it("réduit la zone à un montant quand les fourchettes se touchent", () => {
    expect(bestAmountOverlap([{ min: 100, max: 300 }, { min: 300, max: 500 }])).toEqual({
      start: 300,
      end: 300,
      count: 2,
      total: 2,
    });
  });
});
