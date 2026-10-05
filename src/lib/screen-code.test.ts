import { describe, expect, it } from "vitest";

import { hashScreenCode, newScreenCode, normalizeScreenCode, SCREEN_CODE_LENGTH } from "./screen-code";

describe("newScreenCode", () => {
  it("draws codes of unambiguous characters only", () => {
    for (let i = 0; i < 200; i++) {
      const code = newScreenCode();
      expect(code).toHaveLength(SCREEN_CODE_LENGTH);
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]+$/);
      expect(normalizeScreenCode(code)).toBe(code);
    }
  });

  it("does not repeat itself", () => {
    expect(new Set(Array.from({ length: 200 }, newScreenCode)).size).toBe(200);
  });
});

describe("normalizeScreenCode", () => {
  it("accepts a code typed in lowercase, spaced or with a dash", () => {
    expect(normalizeScreenCode("k7q m3x")).toBe("K7QM3X");
    expect(normalizeScreenCode(" K7Q-M3X ")).toBe("K7QM3X");
  });

  it("refuses what cannot be a code", () => {
    expect(normalizeScreenCode("K7QM3")).toBeNull();
    expect(normalizeScreenCode("K7QM3XY")).toBeNull();
    // 0, O, 1, I and L are never drawn.
    expect(normalizeScreenCode("K7QM30")).toBeNull();
    expect(normalizeScreenCode("K7QMIX")).toBeNull();
    expect(normalizeScreenCode("")).toBeNull();
  });
});

describe("hashScreenCode", () => {
  it("is stable, and never the code itself", () => {
    expect(hashScreenCode("K7QM3X")).toBe(hashScreenCode("K7QM3X"));
    expect(hashScreenCode("K7QM3X")).not.toBe(hashScreenCode("K7QM3Y"));
    expect(hashScreenCode("K7QM3X")).not.toContain("K7QM3X");
  });
});
