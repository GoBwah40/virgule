import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { LocalePreferenceToggle } from "@/components/site/locale-preference";
import { ThemePreferenceToggle } from "@/components/site/theme-preference";
import { SourceLink } from "@/components/source-link";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultLocale } from "@/i18n/config";
import { isLocale } from "@/i18n/locale";
import { REPO_URL } from "@/lib/config";
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
  // Theme chosen by the person; without a choice, the device setting applies (CSS).
  const tFooter = await getTranslations("footer");
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
          <footer className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 pb-4">
            <SourceLink href={REPO_URL} label={tFooter("source")} className="-ml-3" />
            <div className="-mr-3 flex">
              <LocalePreferenceToggle initial={isLocale(locale) ? locale : defaultLocale} />
              <ThemePreferenceToggle initial={theme} />
            </div>
          </footer>
          <Toaster theme={theme} richColors position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
