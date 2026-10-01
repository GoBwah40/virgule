import { describe, expect, it } from "vitest";

import { canRemoveParticipants } from "@/lib/config";

describe("canRemoveParticipants", () => {
  it("allows removal before the first recap", () => {
    expect(canRemoveParticipants({ phase: "THEMES", round: 1 })).toBe(true);
    expect(canRemoveParticipants({ phase: "IDEAS", round: 1 })).toBe(true);
  });

  it("refuses it from the recap on", () => {
    expect(canRemoveParticipants({ phase: "RECAP", round: 1 })).toBe(false);
    expect(canRemoveParticipants({ phase: "CLOSED", round: 1 })).toBe(false);
  });

  it("refuses it in later rounds, which would rewrite past results", () => {
    expect(canRemoveParticipants({ phase: "IDEAS", round: 2 })).toBe(false);
    expect(canRemoveParticipants({ phase: "THEMES", round: 2 })).toBe(false);
  });
});
