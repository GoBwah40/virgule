import { getTranslations } from "next-intl/server";

import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ThemeEditor } from "@/components/phases/theme-editor";
import { SuggestThemeCard, SuggestedThemes } from "@/components/phases/theme-suggestions";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { getThemes, getThemeSuggestions, hostName, loadPhasePage } from "@/lib/room";

export default async function ThemesPage({ params }: PageProps<"/r/[slug]/themes">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["THEMES"]);
  if (!page) return null;

  const t = await getTranslations("themes");
  const [themes, suggestions] = await Promise.all([getThemes(page.room.id), getThemeSuggestions(page.room.id, page.me)]);
  const host = hostName(page.participants);

  if (page.me.isHost) {
    return (
      <PhaseTransition>
        <PageHeader title={t("title")} subtitle={t("hostSubtitle")} />
        {suggestions.length > 0 && (
          <div className="mb-6">
            <SuggestedThemes slug={slug} suggestions={suggestions} />
          </div>
        )}
        <ThemeEditor
          slug={slug}
          themes={themes}
          allowSelfVote={page.room.allowSelfVote}
          ideasTimerMinutes={page.room.ideasTimerMinutes}
          capacity={page.room.capacity}
          participantCount={page.participants.length}
        />
      </PhaseTransition>
    );
  }

  return (
    <PhaseTransition>
      <PageHeader title={t("title")} subtitle={t("guestSubtitle", { host })} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
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
        <SuggestThemeCard slug={slug} host={host} suggestions={suggestions} />
      </div>
    </PhaseTransition>
  );
}
