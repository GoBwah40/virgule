import { getTranslations } from "next-intl/server";

import { ThemeEditor } from "@/components/phases/theme-editor";
import { PhaseTitle } from "@/components/phases/phase-title";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemes, loadPhasePage } from "@/lib/room";

export default async function ThemesPage({ params }: PageProps<"/r/[slug]/themes">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["THEMES"]);
  if (!page) return null;

  const t = await getTranslations("themes");
  const themes = await getThemes(page.room.id);

  if (page.me.isHost) {
    return (
      <>
        <PhaseTitle title={t("title")} subtitle={t("hostSubtitle")} />
        <ThemeEditor slug={slug} themes={themes} allowSelfVote={page.room.allowSelfVote} />
      </>
    );
  }

  return (
    <>
      <PhaseTitle title={t("title")} subtitle={t("guestSubtitle")} />
      {themes.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {themes.map((theme) => (
            <Card key={theme.id}>
              <CardHeader>
                <CardTitle>{theme.title}</CardTitle>
                {theme.description && <CardDescription>{theme.description}</CardDescription>}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
