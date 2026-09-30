import { describe, expect, it } from "vitest";

import { negotiateLocale, resolveLocale } from "./locale";

describe("negotiateLocale", () => {
  it("keeps the first supported language, regional variants included", () => {
    expect(negotiateLocale("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(negotiateLocale("de-DE,de;q=0.9,en-GB;q=0.8,fr;q=0.7")).toBe("en");
  });

  it("follows the q weights rather than the order", () => {
    expect(negotiateLocale("en;q=0.5,fr;q=0.9")).toBe("fr");
  });

  it("ignores unsupported languages, wildcards and q=0", () => {
    expect(negotiateLocale("de,es;q=0.8,*;q=0.5")).toBeNull();
    expect(negotiateLocale("fr;q=0,en")).toBe("en");
    expect(negotiateLocale("")).toBeNull();
    expect(negotiateLocale(null)).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("prefers the saved choice over the device", () => {
    expect(resolveLocale("fr", "en-US")).toBe("fr");
  });

  it("follows the device when nothing valid is saved", () => {
    expect(resolveLocale(undefined, "fr-FR")).toBe("fr");
    expect(resolveLocale("klingon", "fr-FR")).toBe("fr");
  });

  it("falls back to English", () => {
    expect(resolveLocale(null, "ja-JP")).toBe("en");
    expect(resolveLocale(null, null)).toBe("en");
  });
});
