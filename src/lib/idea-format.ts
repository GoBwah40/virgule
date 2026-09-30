import "server-only";

import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { type IdeaFormat, rangeStartPrecision, withFirstOrdinal } from "@/lib/idea-value";

/** Formats of the recap summaries (common slot, compatible budget). */
type OverlapFormat = { dateSpan: (start: string, end: string) => string; amountSpan: (min: number, max: number) => string };

// Idea dates are calendar days: read and displayed in UTC so that no time zone shifts them by a day.
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const DAY = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } as const;
const START = {
  day: { day: "numeric", timeZone: "UTC" },
  dayMonth: { day: "numeric", month: "long", timeZone: "UTC" },
  full: DAY,
} as const;

/**
 * Formatters for `describeIdea`, in the current language, euros without cents.
 * French builds « Du 1er au 14 juin 2027 » by hand; other languages use the native
 * date range format ("June 1 – 14, 2027").
 */
export async function getIdeaFormat(): Promise<IdeaFormat & OverlapFormat> {
  const format = await getFormatter();
  const t = await getTranslations("ideas");
  const french = (await getLocale()) === "fr";
  const day = (iso: string, options: (typeof START)[keyof typeof START]) => {
    const formatted = format.dateTime(toDate(iso), options);
    return french ? withFirstOrdinal(formatted) : formatted;
  };
  const amount = (value: number) =>
    format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  // Each message picks what it needs: French uses start and end, English the whole range.
  const dateParts = (start: string, end: string) => ({
    start: day(start, START[rangeStartPrecision(start, end)]),
    end: day(end, DAY),
    range: format.dateTimeRange(toDate(start), toDate(end), DAY),
  });

  return {
    date: (iso) => day(iso, DAY),
    dateRange: (start, end) => t("dateRange", dateParts(start, end)),
    amount,
    amountRange: (min, max) => t("amountRange", { min: amount(min), max: amount(max) }),
    // Mid-sentence (« Créneau commun : du 12 au 14 juin 2027 », "Common slot: June 12 – 14, 2027").
    dateSpan: (start, end) => (start === end ? day(start, DAY) : t("dateRangeInline", dateParts(start, end))),
    amountSpan: (min, max) => (min === max ? amount(min) : t("amountRangeInline", { min: amount(min), max: amount(max) })),
  };
}
