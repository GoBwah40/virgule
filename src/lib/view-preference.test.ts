import { describe, expect, it } from "vitest";

import { parseViewPreference } from "./view-preference";

describe("parseViewPreference", () => {
  it("reads the board, and falls back to the list for anything else", () => {
    expect(parseViewPreference("board")).toBe("board");
    expect(parseViewPreference("list")).toBe("list");
    expect(parseViewPreference(undefined)).toBe("list");
    expect(parseViewPreference("kanban")).toBe("list");
  });
});
