import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { LocalePreferenceToggle } from "@/components/site/locale-preference";
import { ThemePreferenceToggle } from "@/components/site/theme-preference";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultLocale } from "@/i18n/config";
import { isLocale } from "@/i18n/locale";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme";

import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  // Thème choisi par la personne ; sans choix, on suit le réglage de l'appareil (CSS).
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang={locale}
      className={`${fontVariables} h-full antialiased`}
      data-theme={theme === "system" ? undefined : theme}
    >
      <body className="flex min-h-full flex-col text-base">
        <NextIntlClientProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <footer className="mx-auto flex w-full max-w-5xl justify-end gap-2 px-4 pb-4">
            <LocalePreferenceToggle initial={isLocale(locale) ? locale : defaultLocale} />
            <ThemePreferenceToggle initial={theme} />
          </footer>
          <Toaster theme={theme} richColors position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
