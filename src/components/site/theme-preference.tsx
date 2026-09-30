"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PreferenceMenu } from "@/components/preference-menu";
import { parseThemePreference, THEME_COOKIE, type ThemePreference } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Applies the chosen theme right away and remembers it for the next server renders. */
export function ThemePreferenceToggle({ initial }: { initial: ThemePreference }) {
  const t = useTranslations("theme");
  const router = useRouter();
  const [value, setValue] = useState(initial);

  const change = (next: ThemePreference) => {
    setValue(next);
    const root = document.documentElement;
    if (next === "system") {
      delete root.dataset.theme;
      document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
    } else {
      root.dataset.theme = next;
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    }
    // The rest (notifications…) follows on the next server render.
    router.refresh();
  };

  return (
    <PreferenceMenu
      value={value}
      onChange={(next) => change(parseThemePreference(next))}
      label={t("label")}
      options={[
        { value: "system", label: t("system"), icon: Monitor },
        { value: "light", label: t("light"), icon: Sun },
        { value: "dark", label: t("dark"), icon: Moon },
      ]}
    />
  );
}
