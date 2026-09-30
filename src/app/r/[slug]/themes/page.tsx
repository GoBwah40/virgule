import { getTranslations } from "next-intl/server";

import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ThemeEditor } from "@/components/phases/theme-editor";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { getThemes, hostName, loadPhasePage } from "@/lib/room";

export default async function ThemesPage({ params }: PageProps<"/r/[slug]/themes">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["THEMES"]);
  if (!page) return null;

  const t = await getTranslations("themes");
  const themes = await getThemes(page.room.id);

  if (page.me.isHost) {
    return (
      <PhaseTransition>
        <PageHeader title={t("title")} subtitle={t("hostSubtitle")} />
        <ThemeEditor slug={slug} themes={themes} allowSelfVote={page.room.allowSelfVote} />
      </PhaseTransition>
    );
  }

  return (
    <PhaseTransition>
      <PageHeader title={t("title")} subtitle={t("guestSubtitle", { host: hostName(page.participants) })} />
      {themes.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid items-start gap-2 md:grid-cols-2">
          {themes.map((theme) => (
            <ListItem
              key={theme.id}
              tone="plain"
              meta={
                (theme.description || theme.kind !== "TEXT") && (
                  <>
                    {theme.kind !== "TEXT" && <IconBadge icon={THEME_KIND_ICONS[theme.kind]} label={t(`kinds.${theme.kind}`)} />}
                    {theme.description && <span className="text-sm text-muted-foreground">{theme.description}</span>}
                  </>
                )
              }
            >
              {theme.title}
            </ListItem>
          ))}
        </ul>
      )}
    </PhaseTransition>
  );
}
