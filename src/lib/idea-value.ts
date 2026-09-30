// Typed topics: idea validation and value formatting (pure functions, tested in
// idea-value.test.ts). Formatting receives its formatters as a parameter to stay
// independent of next-intl.

import { LIMITS } from "@/lib/config";

export const THEME_KINDS = ["TEXT", "DATE", "DATE_RANGE", "AMOUNT", "AMOUNT_RANGE", "PLACE", "CHOICE"] as const;
export type ThemeKind = (typeof THEME_KINDS)[number];

/** Raw input sent by the idea form. */
export type IdeaInput = {
  content?: string;
  dateStart?: string;
  dateEnd?: string;
  amountMin?: number;
  amountMax?: number;
};

/** Fields stored in the database for an idea. */
export type IdeaFields = {
  content: string;
  dateStart: string | null;
  dateEnd: string | null;
  amountMin: number | null;
  amountMax: number | null;
};

export type IdeaValueError = "invalidInput" | "invalidDateRange" | "invalidAmountRange";

/** Maximum accepted amount (whole euros). */
export const MAX_AMOUNT = 10_000_000;

const EMPTY: IdeaFields = { content: "", dateStart: null, dateEnd: null, amountMin: null, amountMax: null };

/** Real calendar date "YYYY-MM-DD" (rejects, for example, February 31). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT;

/** Validates the input against the topic kind and returns the fields to save. */
export function parseIdeaInput(
  kind: ThemeKind,
  input: IdeaInput,
): { ok: true; fields: IdeaFields } | { ok: false; error: IdeaValueError } {
  switch (kind) {
    // Place and free-form list suggestion: text, like a TEXT topic.
    case "TEXT":
    case "PLACE":
    case "CHOICE": {
      const content = input.content?.trim() ?? "";
      if (!content || content.length > LIMITS.idea) return { ok: false, error: "invalidInput" };
      return { ok: true, fields: { ...EMPTY, content } };
    }
    case "DATE":
      if (!isIsoDate(input.dateStart)) return { ok: false, error: "invalidInput" };
      return { ok: true, fields: { ...EMPTY, dateStart: input.dateStart } };
    case "DATE_RANGE":
      if (!isIsoDate(input.dateStart) || !isIsoDate(input.dateEnd)) return { ok: false, error: "invalidInput" };
      // ISO dates compare directly as strings.
      if (input.dateEnd < input.dateStart) return { ok: false, error: "invalidDateRange" };
      return { ok: true, fields: { ...EMPTY, dateStart: input.dateStart, dateEnd: input.dateEnd } };
    case "AMOUNT":
      if (!isAmount(input.amountMin)) return { ok: false, error: "invalidInput" };
      return { ok: true, fields: { ...EMPTY, amountMin: input.amountMin } };
    case "AMOUNT_RANGE":
      if (!isAmount(input.amountMin) || !isAmount(input.amountMax)) return { ok: false, error: "invalidInput" };
      if (input.amountMax < input.amountMin) return { ok: false, error: "invalidAmountRange" };
      return { ok: true, fields: { ...EMPTY, amountMin: input.amountMin, amountMax: input.amountMax } };
  }
}

/**
 * Precision to give the start date of a period, so as not to repeat what the end date
 * already carries (French output: « Du 12 au 14 juin 2027 », « Du 28 juin au 2 juillet 2027 »).
 */
export function rangeStartPrecision(startIso: string, endIso: string): "day" | "dayMonth" | "full" {
  if (startIso.slice(0, 4) !== endIso.slice(0, 4)) return "full";
  return startIso.slice(0, 7) === endIso.slice(0, 7) ? "day" : "dayMonth";
}

/**
 * Comparison key to spot duplicates within a topic. For text, case, accents, punctuation
 * and spaces are ignored: "Pique-nique !" = "pique nique".
 * For typed topics, two ideas are identical if their values are.
 */
export function ideaKey(kind: ThemeKind, fields: IdeaFields): string {
  switch (kind) {
    case "TEXT":
    case "PLACE":
    case "CHOICE":
      return fields.content
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    case "DATE":
    case "DATE_RANGE":
      return `${fields.dateStart}/${fields.dateEnd ?? fields.dateStart}`;
    case "AMOUNT":
    case "AMOUNT_RANGE":
      return `${fields.amountMin}/${fields.amountMax ?? fields.amountMin}`;
  }
}

/** Comparison key for a plain text (list options). */
export const textKey = (content: string) => ideaKey("TEXT", { ...EMPTY, content });

/** In French, the first of the month is written "1er" (« 1er octobre 2026 », « Du 1er au 30 »). */
export const withFirstOrdinal = (formatted: string) => formatted.replace(/^1(?!\d)/, "1er");

export type IdeaFormat = {
  date: (iso: string) => string;
  dateRange: (startIso: string, endIso: string) => string;
  amount: (value: number) => string;
  amountRange: (min: number, max: number) => string;
};

/** Text displayed for an idea (voting, recap, exports). */
export function describeIdea(kind: ThemeKind, fields: IdeaFields, format: IdeaFormat): string {
  switch (kind) {
    case "DATE":
      return fields.dateStart ? format.date(fields.dateStart) : fields.content;
    case "DATE_RANGE":
      if (!fields.dateStart || !fields.dateEnd) return fields.content;
      return fields.dateStart === fields.dateEnd
        ? format.date(fields.dateStart)
        : format.dateRange(fields.dateStart, fields.dateEnd);
    case "AMOUNT":
      return fields.amountMin !== null ? format.amount(fields.amountMin) : fields.content;
    case "AMOUNT_RANGE":
      if (fields.amountMin === null || fields.amountMax === null) return fields.content;
      return fields.amountMin === fields.amountMax
        ? format.amount(fields.amountMin)
        : format.amountRange(fields.amountMin, fields.amountMax);
    case "TEXT":
    case "PLACE":
    case "CHOICE":
      return fields.content;
  }
}

// ─── "List" topics ─────────────────────────────────────────────────────────

/** Number of options in a list. */
export const CHOICE_OPTIONS = { min: 2, max: 10 } as const;
/** Maximum length of an option. */
export const MAX_OPTION_LENGTH = 60;

/**
 * Validates list options: trimmed, 2 to 10 non-empty options, no duplicates (same
 * comparison as for ideas). Returns null if the list is invalid.
 */
export function parseChoiceOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const options = raw.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.length < CHOICE_OPTIONS.min || options.length > CHOICE_OPTIONS.max) return null;
  if (options.some((o) => !o || o.length > MAX_OPTION_LENGTH)) return null;
  const keys = options.map(textKey);
  return new Set(keys).size === keys.length ? options : null;
}

/** Options stored in the database (JSON); an unreadable value gives an empty list. */
export function readChoiceOptions(stored: string | null): string[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((o): o is string => typeof o === "string") : [];
  } catch {
    return [];
  }
}

// ─── "Place" topics ────────────────────────────────────────────────────────

/**
 * Search link that opens the installed maps app: Apple Maps on Apple devices,
 * Google Maps elsewhere (the app on Android, the website on desktop).
 */
export function mapSearchUrl(query: string, apple: boolean): string {
  const q = encodeURIComponent(query);
  return apple ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}
