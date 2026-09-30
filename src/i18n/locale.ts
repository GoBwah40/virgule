import { defaultLocale, type Locale, locales } from "@/i18n/config";

export const isLocale = (value: string | null | undefined): value is Locale =>
  locales.includes(value as Locale);

/**
 * First supported language of an `Accept-Language` header (or of `navigator.languages`
 * joined with commas), by decreasing preference: "fr-CA,fr;q=0.9,en;q=0.8" → "fr".
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter(({ base, q }) => base && base !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked.map(({ base }) => base).find(isLocale) ?? null;
}

/** Saved choice first, then the device language, then English. */
export function resolveLocale(saved: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(saved)) return saved;
  return negotiateLocale(acceptLanguage) ?? defaultLocale;
}
