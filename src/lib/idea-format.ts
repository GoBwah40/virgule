import "server-only";

import { getFormatter, getTranslations } from "next-intl/server";

import { type IdeaFormat, rangeStartPrecision, withFirstOrdinal } from "@/lib/idea-value";

/** Formats des synthèses du bilan (créneau commun, budget compatible). */
type OverlapFormat = { dateSpan: (start: string, end: string) => string; amountSpan: (min: number, max: number) => string };

// Les dates des idées sont des jours calendaires : on les lit et les affiche en UTC
// pour qu'aucun fuseau ne les décale d'un jour.
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const DAY = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } as const;
const START = {
  day: { day: "numeric", timeZone: "UTC" },
  dayMonth: { day: "numeric", month: "long", timeZone: "UTC" },
  full: DAY,
} as const;

/** Formateurs français pour `describeIdea` (« Du … au … », « De … € à … € », euros sans centimes). */
export async function getIdeaFormat(): Promise<IdeaFormat & OverlapFormat> {
  const format = await getFormatter();
  const t = await getTranslations("ideas");
  const day = (iso: string, options: (typeof START)[keyof typeof START]) =>
    withFirstOrdinal(format.dateTime(toDate(iso), options));
  const amount = (value: number) =>
    format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const dateParts = (start: string, end: string) => ({
    start: day(start, START[rangeStartPrecision(start, end)]),
    end: day(end, DAY),
  });

  return {
    date: (iso) => day(iso, DAY),
    dateRange: (start, end) => t("dateRange", dateParts(start, end)),
    amount,
    amountRange: (min, max) => t("amountRange", { min: amount(min), max: amount(max) }),
    // En milieu de phrase (« Créneau commun : du 12 au 14 juin 2027 »).
    dateSpan: (start, end) => (start === end ? day(start, DAY) : t("dateRangeInline", dateParts(start, end))),
    amountSpan: (min, max) => (min === max ? amount(min) : t("amountRangeInline", { min: amount(min), max: amount(max) })),
  };
}
