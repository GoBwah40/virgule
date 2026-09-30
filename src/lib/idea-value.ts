// Sujets typés : validation des idées et mise en forme de leur valeur (fonctions pures,
// testées dans idea-value.test.ts). La mise en forme reçoit ses formateurs en paramètre
// pour rester indépendante de next-intl.

import { LIMITS } from "@/lib/config";

export const THEME_KINDS = ["TEXT", "DATE", "DATE_RANGE", "AMOUNT", "AMOUNT_RANGE", "PLACE", "CHOICE"] as const;
export type ThemeKind = (typeof THEME_KINDS)[number];

/** Saisie brute envoyée par le formulaire d'idée. */
export type IdeaInput = {
  content?: string;
  dateStart?: string;
  dateEnd?: string;
  amountMin?: number;
  amountMax?: number;
};

/** Champs enregistrés en base pour une idée. */
export type IdeaFields = {
  content: string;
  dateStart: string | null;
  dateEnd: string | null;
  amountMin: number | null;
  amountMax: number | null;
};

export type IdeaValueError = "invalidInput" | "invalidDateRange" | "invalidAmountRange";

/** Montant maximal accepté (euros entiers). */
export const MAX_AMOUNT = 10_000_000;

const EMPTY: IdeaFields = { content: "", dateStart: null, dateEnd: null, amountMin: null, amountMax: null };

/** Date calendaire « AAAA-MM-JJ » réellement existante (refuse par exemple le 31 février). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT;

/** Valide la saisie selon le type du sujet et renvoie les champs à enregistrer. */
export function parseIdeaInput(
  kind: ThemeKind,
  input: IdeaInput,
): { ok: true; fields: IdeaFields } | { ok: false; error: IdeaValueError } {
  switch (kind) {
    // Lieu et proposition libre d'une liste : du texte, comme un sujet TEXT.
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
      // Les dates ISO se comparent directement comme des chaînes.
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
 * Précision à donner à la date de début d'une période, pour ne pas répéter ce que
 * porte déjà la date de fin : « Du 12 au 14 juin 2027 », « Du 28 juin au 2 juillet 2027 ».
 */
export function rangeStartPrecision(startIso: string, endIso: string): "day" | "dayMonth" | "full" {
  if (startIso.slice(0, 4) !== endIso.slice(0, 4)) return "full";
  return startIso.slice(0, 7) === endIso.slice(0, 7) ? "day" : "dayMonth";
}

/**
 * Clé de comparaison pour repérer les doublons au sein d'un sujet. Pour le texte, on ignore
 * la casse, les accents, la ponctuation et les espaces : « Pique-nique ! » = « pique nique ».
 * Pour les sujets typés, deux idées sont identiques si leurs valeurs le sont.
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

/** Clé de comparaison d'un texte seul (options d'une liste). */
export const textKey = (content: string) => ideaKey("TEXT", { ...EMPTY, content });

/** En français, le premier du mois s'écrit « 1er » (« 1er octobre 2026 », « Du 1er au 30 »). */
export const withFirstOrdinal = (formatted: string) => formatted.replace(/^1(?!\d)/, "1er");

export type IdeaFormat = {
  date: (iso: string) => string;
  dateRange: (startIso: string, endIso: string) => string;
  amount: (value: number) => string;
  amountRange: (min: number, max: number) => string;
};

/** Texte affiché pour une idée (vote, bilan, exports). */
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

// ─── Sujets « Liste » ───────────────────────────────────────────────────────

/** Nombre d'options d'une liste. */
export const CHOICE_OPTIONS = { min: 2, max: 10 } as const;
/** Longueur maximale d'une option. */
export const MAX_OPTION_LENGTH = 60;

/**
 * Valide les options d'une liste : espaces retirés, 2 à 10 options non vides, sans doublon
 * (même comparaison que pour les idées). Renvoie null si la liste n'est pas valide.
 */
export function parseChoiceOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const options = raw.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.length < CHOICE_OPTIONS.min || options.length > CHOICE_OPTIONS.max) return null;
  if (options.some((o) => !o || o.length > MAX_OPTION_LENGTH)) return null;
  const keys = options.map(textKey);
  return new Set(keys).size === keys.length ? options : null;
}

/** Options enregistrées en base (JSON) ; une valeur illisible donne une liste vide. */
export function readChoiceOptions(stored: string | null): string[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((o): o is string => typeof o === "string") : [];
  } catch {
    return [];
  }
}

// ─── Sujets « Lieu » ────────────────────────────────────────────────────────

/**
 * Lien de recherche qui ouvre l'app de cartes installée : Plans sur les appareils Apple,
 * Google Maps ailleurs (l'app sur Android, le site sur ordinateur).
 */
export function mapSearchUrl(query: string, apple: boolean): string {
  const q = encodeURIComponent(query);
  return apple ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}
