import { describe, expect, it } from "vitest";

import { parseTopicFormPreference } from "./topic-form-preference";

describe("parseTopicFormPreference", () => {
  it("reads the advanced form, and falls back to the simple one for anything else", () => {
    expect(parseTopicFormPreference("advanced")).toBe("advanced");
    expect(parseTopicFormPreference("simple")).toBe("simple");
    expect(parseTopicFormPreference(undefined)).toBe("simple");
    expect(parseTopicFormPreference("expert")).toBe("simple");
  });
});
