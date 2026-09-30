"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LocaleToggle } from "@/components/locale-toggle";
import { LOCALE_COOKIE, type Locale, localeNames, locales } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;
const OPTIONS = locales.map((locale) => ({ value: locale, short: locale.toUpperCase(), name: localeNames[locale] }));

/** Saves the chosen language for the next server renders, then re-renders the page in it. */
export function LocalePreferenceToggle({ initial }: { initial: Locale }) {
  const t = useTranslations("language");
  const router = useRouter();
  const [value, setValue] = useState<string>(initial);

  const change = (next: string) => {
    setValue(next);
    document.documentElement.lang = next;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.refresh();
  };

  return <LocaleToggle value={value} options={OPTIONS} onChange={change} labels={{ group: t("label") }} />;
}
