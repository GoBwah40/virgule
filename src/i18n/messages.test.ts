import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { defaultLocale } from "@/i18n/config";

// i18n rule: a key present in one language must exist in all the others.
// It also guards the addition of further languages.

type Messages = { [key: string]: string | Messages };

const dir = path.join(process.cwd(), "messages");
const locales = readdirSync(dir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""));

const load = (locale: string): Messages => JSON.parse(readFileSync(path.join(dir, `${locale}.json`), "utf8"));

/** Flat keys: { a: { b: "…" } } → ["a.b"]. */
function flatKeys(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [full] : flatKeys(value, full);
  });
}

describe("translation files", () => {
  it("include the default language", () => {
    expect(locales).toContain(defaultLocale);
  });

  const keysByLocale = new Map(locales.map((locale) => [locale, new Set(flatKeys(load(locale)))]));
  const allKeys = new Set([...keysByLocale.values()].flatMap((keys) => [...keys]));

  it.each(locales)("%s has every key of the other languages", (locale) => {
    const keys = keysByLocale.get(locale)!;
    const missing = [...allKeys].filter((key) => !keys.has(key)).sort();
    expect(missing, `Keys missing from messages/${locale}.json`).toEqual([]);
  });

  it.each(locales)("%s has no empty translation", (locale) => {
    const empty = flatKeys(load(locale)).filter((key) => {
      const value = key.split(".").reduce<string | Messages>((node, part) => (node as Messages)[part], load(locale));
      return typeof value === "string" && value.trim() === "";
    });
    expect(empty, `Empty translations in messages/${locale}.json`).toEqual([]);
  });
});
