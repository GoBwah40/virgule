import { describe, expect, it } from "vitest";

import { parseThemePreference } from "@/lib/theme";

describe("parseThemePreference", () => {
  it("reconnaît clair et sombre", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });
  it("suit le système sans cookie ou avec une valeur inconnue", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference("violet")).toBe("system");
  });
});
