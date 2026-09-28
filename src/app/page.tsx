import { ListChecks, Lightbulb, Tags } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CreateRoomForm } from "@/components/create-room-form";
import { MAX_PARTICIPANTS } from "@/lib/config";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  const steps = [
    { icon: Tags, text: t("steps.themes") },
    { icon: Lightbulb, text: t("steps.ideas") },
    { icon: ListChecks, text: t("steps.recap") },
  ];

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-4 py-12 md:grid-cols-2">
      <section className="space-y-6">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{tApp("name")}</p>
        <h1 className="text-4xl font-bold tracking-tight text-balance">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("subtitle", { max: MAX_PARTICIPANTS })}</p>
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>
      <CreateRoomForm />
    </main>
  );
}
