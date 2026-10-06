import { Vote } from "lucide-react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { BoardColumns } from "@/components/board-columns";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ThemeEditor } from "@/components/phases/theme-editor";
import { SuggestThemeCard, SuggestedThemes } from "@/components/phases/theme-suggestions";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { ViewChoice, ViewChoiceSwitch, ViewProvider } from "@/components/phases/view-choice";
import { TopicCard } from "@/components/topic-card";
import { getThemes, getThemeSuggestions, hostName, loadPhasePage } from "@/lib/room";
import { parseViewPreference, VIEW_COOKIE } from "@/lib/view-preference";

export default async function ThemesPage({ params }: PageProps<"/r/[slug]/themes">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["THEMES"]);
  if (!page) return null;

  const t = await getTranslations("themes");
  const [themes, suggestions] = await Promise.all([getThemes(page.room.id, page.room.round), getThemeSuggestions(page.room.id, page.me)]);
  const host = hostName(page.participants);
  const initialView = parseViewPreference((await cookies()).get(VIEW_COOKIE)?.value);

  if (page.me.isHost) {
    return (
      <PhaseTransition>
        <ViewProvider initialView={initialView}>
          <PageHeader title={t("title")} subtitle={t("hostSubtitle")} actions={themes.length > 0 && <ViewChoiceSwitch />} />
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
        </ViewProvider>
      </PhaseTransition>
    );
  }

  return (
    <PhaseTransition>
      <ViewProvider initialView={initialView}>
        <PageHeader title={t("title")} subtitle={t("guestSubtitle", { host })} actions={themes.length > 0 && <ViewChoiceSwitch />} />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          {themes.length === 0 ? (
            <p className="text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="min-w-0">
              <ViewChoice
                list={
                  <ul className="grid items-start gap-2 md:grid-cols-2">
                    {themes.map((theme) => (
                      <ListItem
                        key={theme.id}
                        tone="plain"
                        meta={
                          (theme.description || theme.kind !== "TEXT" || theme.maxVotes !== null) && (
                            <>
                              {theme.kind !== "TEXT" && <IconBadge icon={THEME_KIND_ICONS[theme.kind]} label={t(`kinds.${theme.kind}`)} />}
                              {theme.maxVotes !== null && <IconBadge icon={Vote} label={t("voteLimitBadge", { count: theme.maxVotes })} />}
                              {theme.description && <span className="text-sm text-muted-foreground">{theme.description}</span>}
                            </>
                          )
                        }
                      >
                        {theme.title}
                      </ListItem>
                    ))}
                  </ul>
                }
                board={
                  <BoardColumns as="ul">
                    {themes.map((theme) => (
                      <TopicCard
                        key={theme.id}
                        title={theme.title}
                        description={theme.description}
                        badges={[
                          ...(theme.kind === "TEXT" ? [] : [{ label: t(`kinds.${theme.kind}`), icon: THEME_KIND_ICONS[theme.kind] }]),
                          ...(theme.maxVotes === null ? [] : [{ label: t("voteLimitBadge", { count: theme.maxVotes }), icon: Vote }]),
                        ]}
                      />
                    ))}
                  </BoardColumns>
                }
              />
            </div>
          )}
          <SuggestThemeCard slug={slug} host={host} suggestions={suggestions} />
        </div>
      </ViewProvider>
    </PhaseTransition>
  );
}
