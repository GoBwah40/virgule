/** Available languages: add the new locale here, with its messages/<locale>.json file. */
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

/** Used when neither the saved choice nor the device language is available. */
export const defaultLocale: Locale = "en";

/** Cookie holding the language picked in the footer (absent: follow the device). */
export const LOCALE_COOKIE = "virgule_locale";

/** Each language's own name, shown as-is in the picker. */
export const localeNames: Record<Locale, string> = { en: "English", fr: "Français" };
