import "server-only";

import { getFormatter, getTranslations } from "next-intl/server";

import type { IdeaFormat } from "@/lib/idea-value";

// Les dates des idées sont des jours calendaires : on les lit et les affiche en UTC
// pour qu'aucun fuseau ne les décale d'un jour.
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const DAY = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } as const;

/** Formateurs français pour `describeIdea` (dates longues, euros sans centimes). */
export async function getIdeaFormat(): Promise<IdeaFormat> {
  const format = await getFormatter();
  const t = await getTranslations("ideas");
  const amount = (value: number) =>
    format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return {
    date: (iso) => format.dateTime(toDate(iso), DAY),
    dateRange: (start, end) => format.dateTimeRange(toDate(start), toDate(end), DAY),
    amount,
    amountRange: (min, max) => t("amountRange", { min: amount(min), max: amount(max) }),
  };
}
