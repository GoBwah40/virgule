"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_COOKIE, type ThemePreference } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Applique le thème choisi tout de suite et le mémorise pour les prochains rendus serveur. */
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
    // Le reste (notifications…) suit au prochain rendu serveur.
    router.refresh();
  };

  return (
    <ThemeToggle
      value={value}
      onChange={change}
      labels={{ group: t("label"), system: t("system"), light: t("light"), dark: t("dark") }}
    />
  );
}
