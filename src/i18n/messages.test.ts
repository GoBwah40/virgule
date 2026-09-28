import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { defaultLocale } from "@/i18n/config";

// Règle i18n : une clé présente dans une langue doit exister dans toutes les autres.
// Avec une seule langue, le test passe ; il protège l'ajout des suivantes.

type Messages = { [key: string]: string | Messages };

const dir = path.join(process.cwd(), "messages");
const locales = readdirSync(dir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""));

const load = (locale: string): Messages => JSON.parse(readFileSync(path.join(dir, `${locale}.json`), "utf8"));

/** Clés à plat : { a: { b: "…" } } → ["a.b"]. */
function flatKeys(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [full] : flatKeys(value, full);
  });
}

describe("fichiers de traduction", () => {
  it("contiennent la langue par défaut", () => {
    expect(locales).toContain(defaultLocale);
  });

  const keysByLocale = new Map(locales.map((locale) => [locale, new Set(flatKeys(load(locale)))]));
  const allKeys = new Set([...keysByLocale.values()].flatMap((keys) => [...keys]));

  it.each(locales)("%s contient toutes les clés des autres langues", (locale) => {
    const keys = keysByLocale.get(locale)!;
    const missing = [...allKeys].filter((key) => !keys.has(key)).sort();
    expect(missing, `Clés absentes de messages/${locale}.json`).toEqual([]);
  });

  it.each(locales)("%s n'a aucune traduction vide", (locale) => {
    const empty = flatKeys(load(locale)).filter((key) => {
      const value = key.split(".").reduce<string | Messages>((node, part) => (node as Messages)[part], load(locale));
      return typeof value === "string" && value.trim() === "";
    });
    expect(empty, `Traductions vides dans messages/${locale}.json`).toEqual([]);
  });
});
