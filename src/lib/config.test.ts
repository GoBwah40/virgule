import { describe, expect, it } from "vitest";

import { canRemoveParticipants, DEFAULT_ROOM_SIZE, MAX_PARTICIPANTS, roomCapacity, ROOM_SIZES } from "@/lib/config";

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

describe("roomCapacity", () => {
  it("uses the size chosen by the host", () => {
    expect(roomCapacity({ maxParticipants: 12 })).toBe(12);
  });

  it("falls back to the default size for rooms created before the choice existed", () => {
    expect(roomCapacity({ maxParticipants: null })).toBe(DEFAULT_ROOM_SIZE);
  });

  it("offers the default size, and nothing beyond the maximum", () => {
    expect(ROOM_SIZES).toContain(DEFAULT_ROOM_SIZE);
    expect(MAX_PARTICIPANTS).toBe(12);
  });
});
