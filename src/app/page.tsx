import { ListChecks, Lightbulb, Tags } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { CreateRoomForm } from "@/components/home/create-room-form";
import { IconList } from "@/components/icon-list";
import { KeyFigures } from "@/components/key-figures";
import { Logo } from "@/components/logo";
import { PhaseTransition } from "@/components/phase-transition";
import { Rosette } from "@/components/rosette";
import { ReleaseNotes } from "@/components/site/release-notes";
import { defaultLocale } from "@/i18n/config";
import { isLocale } from "@/i18n/locale";
import { MAX_PARTICIPANTS, ROOM_TTL_DAYS } from "@/lib/config";
import { APP_VERSION, getReleaseNotes } from "@/lib/release-notes-source";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");
  const format = await getFormatter();
  const locale = await getLocale();
  // Release dates ("YYYY-MM-DD") read in UTC, like idea dates.
  const releases = (await getReleaseNotes(isLocale(locale) ? locale : defaultLocale)).map((release) => ({
    ...release,
    date: format.dateTime(new Date(`${release.date}T00:00:00Z`), { dateStyle: "long", timeZone: "UTC" }),
  }));

  // `overflow-x-clip`: the rosette can overflow the screen edge without creating horizontal scroll.
  return (
    <PhaseTransition className="flex flex-1 flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 pt-6">
        <Logo label={tApp("name")} className="text-[28px]" />
        <ReleaseNotes version={APP_VERSION} releases={releases} />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-x-12 gap-y-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <section className="space-y-6">
          <h1 className="text-[40px] leading-[1.02] font-extrabold tracking-tight md:text-6xl">
            {t.rich("title", {
              // Mango highlight under the end of the title; more muted in dark mode to keep the text readable.
              hl: (chunks) => (
                <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,var(--color-highlight)_62%,var(--color-highlight)_92%,transparent_92%)] px-[0.04em] dark:bg-[linear-gradient(transparent_62%,var(--color-highlight-soft)_62%,var(--color-highlight-soft)_92%,transparent_92%)]">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="text-lg text-muted-foreground">{t("subtitle", { max: MAX_PARTICIPANTS })}</p>
          <IconList
            items={[
              { icon: Tags, text: t("steps.themes") },
              { icon: Lightbulb, text: t("steps.ideas") },
              { icon: ListChecks, text: t("steps.recap") },
            ]}
          />
        </section>
        {/* The rosette overflows behind the card corner: `isolate` keeps its z-index local. */}
        <div className="relative isolate">
          <Rosette className="absolute -top-16 -right-10 -z-10 size-44 md:-top-24 md:-right-16 md:size-56" />
          <CreateRoomForm />
        </div>
        <KeyFigures
          className="border-t border-dashed pt-5 md:col-span-2"
          items={[
            { value: MAX_PARTICIPANTS, label: t("figures.seats", { count: MAX_PARTICIPANTS }) },
            { value: 1, label: t("figures.link") },
            { value: ROOM_TTL_DAYS, label: t("figures.days", { count: ROOM_TTL_DAYS }) },
            { value: 0, label: t("figures.account") },
          ]}
        />
      </main>
    </PhaseTransition>
  );
}
