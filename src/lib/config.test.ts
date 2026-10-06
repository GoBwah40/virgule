import { describe, expect, it } from "vitest";

import {
  canRemoveParticipants,
  DEFAULT_ROOM_SIZE,
  ideaEditableUntil,
  isRecentNudge,
  MAX_PARTICIPANTS,
  nextNudgeAt,
  roomCapacity,
  ROOM_SIZES,
} from "@/lib/config";

describe("canRemoveParticipants", () => {
  it("allows removal before the first recap", () => {
    expect(canRemoveParticipants({ phase: "THEMES", round: 1, recapSeen: false })).toBe(true);
    expect(canRemoveParticipants({ phase: "IDEAS", round: 1, recapSeen: false })).toBe(true);
  });

  it("refuses it from the recap on", () => {
    expect(canRemoveParticipants({ phase: "RECAP", round: 1, recapSeen: false })).toBe(false);
    expect(canRemoveParticipants({ phase: "CLOSED", round: 1, recapSeen: false })).toBe(false);
  });

  it("refuses it in later rounds, which would rewrite past results", () => {
    expect(canRemoveParticipants({ phase: "IDEAS", round: 2, recapSeen: false })).toBe(false);
    expect(canRemoveParticipants({ phase: "THEMES", round: 2, recapSeen: false })).toBe(false);
  });

  it("refuses it once the recap has been seen, even after voting is reopened", () => {
    expect(canRemoveParticipants({ phase: "IDEAS", round: 1, recapSeen: true })).toBe(false);
    expect(canRemoveParticipants({ phase: "THEMES", round: 1, recapSeen: true })).toBe(false);
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

describe("ideaEditableUntil", () => {
  it("leaves two minutes after the idea is suggested, whatever the votes", () => {
    expect(ideaEditableUntil(new Date("2027-06-12T10:00:00Z"))).toEqual(new Date("2027-06-12T10:02:00Z"));
  });
});

describe("nextNudgeAt", () => {
  it("allows a reminder right away when none was sent", () => {
    expect(nextNudgeAt(null)).toBeNull();
  });

  it("waits a minute after the last reminder", () => {
    expect(nextNudgeAt(new Date("2027-06-12T10:00:00Z"))).toEqual(new Date("2027-06-12T10:01:00Z"));
  });
});

describe("isRecentNudge", () => {
  const now = new Date("2027-06-12T10:10:00Z");

  it("keeps a reminder sent a few minutes ago", () => {
    expect(isRecentNudge(new Date("2027-06-12T10:06:00Z"), now)).toBe(true);
  });

  it("drops an old reminder, or none", () => {
    expect(isRecentNudge(new Date("2027-06-12T10:05:00Z"), now)).toBe(false);
    expect(isRecentNudge(null, now)).toBe(false);
  });
});
