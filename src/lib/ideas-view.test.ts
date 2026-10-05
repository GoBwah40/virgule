import { describe, expect, it } from "vitest";

import { parseIdeasView } from "./ideas-view";

describe("parseIdeasView", () => {
  it("reads the board, and falls back to the list for anything else", () => {
    expect(parseIdeasView("board")).toBe("board");
    expect(parseIdeasView("list")).toBe("list");
    expect(parseIdeasView(undefined)).toBe("list");
    expect(parseIdeasView("kanban")).toBe("list");
  });
});
