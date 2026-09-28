import { ListChecks, Lightbulb, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CreateRoomForm } from "@/components/home/create-room-form";
import { IconList } from "@/components/icon-list";
import { MAX_PARTICIPANTS } from "@/lib/config";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 md:grid-cols-2 md:gap-12 md:py-16">
      <section className="space-y-6">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">{tApp("name")}</p>
        <h1 className="text-[40px] leading-[1.02] font-extrabold tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("subtitle", { max: MAX_PARTICIPANTS })}</p>
        <IconList
          items={[
            { icon: Tags, text: t("steps.themes") },
            { icon: Lightbulb, text: t("steps.ideas") },
            { icon: ListChecks, text: t("steps.recap") },
          ]}
        />
      </section>
      <CreateRoomForm />
    </main>
  );
}
