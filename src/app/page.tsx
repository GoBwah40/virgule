import { ListChecks, Lightbulb, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CreateRoomForm } from "@/components/home/create-room-form";
import { IconList } from "@/components/icon-list";
import { KeyFigures } from "@/components/key-figures";
import { Logo } from "@/components/logo";
import { PhaseTransition } from "@/components/phase-transition";
import { Rosette } from "@/components/rosette";
import { MAX_PARTICIPANTS, ROOM_TTL_DAYS } from "@/lib/config";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  // `overflow-x-clip` : la rosace peut dépasser du bord de l'écran sans créer de défilement horizontal.
  return (
    <PhaseTransition className="flex flex-1 flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-5xl px-4 pt-6">
        <Logo label={tApp("name")} className="text-[28px]" />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-x-12 gap-y-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <section className="space-y-6">
          <h1 className="text-[40px] leading-[1.02] font-extrabold tracking-tight md:text-6xl">
            {t.rich("title", {
              // Surlignage mangue sous la fin du titre ; plus sourd en sombre pour garder le texte lisible.
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
        {/* La rosace déborde derrière le coin de la carte : `isolate` garde son z-index local. */}
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
