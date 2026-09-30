import { describe, expect, it } from "vitest";

import { parseThemePreference } from "@/lib/theme";

describe("parseThemePreference", () => {
  it("recognises light and dark", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });
  it("follows the system without a cookie or with an unknown value", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference("violet")).toBe("system");
  });
});
