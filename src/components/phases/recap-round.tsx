import { CalendarPlus, Equal } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { AmountOverview } from "@/components/amount-overview";
import { CommentThread } from "@/components/comment-thread";
import { CountBadge } from "@/components/count-badge";
import { DateOverview } from "@/components/date-overview";
import { ExpandableListItem } from "@/components/expandable-list-item";
import { MapLink } from "@/components/map-link";
import { OverviewSummary } from "@/components/overview-summary";
import { PresentationCarousel } from "@/components/presentation-carousel";
import { PresentationResult } from "@/components/presentation-result";
import { StatusBadge } from "@/components/status-badge";
import { VoteSummary } from "@/components/vote-summary";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOverviewText } from "@/lib/overview-format";
import { topQualified } from "@/lib/results";
import type { CommentView, RecapOverview, RecapRound } from "@/lib/room";
import { cn } from "@/lib/utils";

/** Link to a topic's calendar file; only given for the latest round, the one that counts. */
type CalendarHref = (themeId: string) => string;

/** Downloads the decided date or period of a topic, to add it to a calendar. */
async function AddToCalendar({ href }: { href: string }) {
  const t = await getTranslations("recap");
  return (
    // A link to a file, not an action: an <a> styled as a button.
    <a href={href} download className={cn(buttonVariants({ variant: "outline" }), "self-start print:hidden")}>
      <CalendarPlus data-icon="inline-start" />
      {t("addToCalendar")}
    </a>
  );
}

export async function RecapRoundView({
  round,
  calendarHref,
  comments,
}: {
  round: RecapRound;
  calendarHref?: CalendarHref;
  /** Comments by idea, read-only: the session's own recap only, never the shared one. */
  comments?: Record<string, CommentView[]>;
}) {
  const t = await getTranslations("recap");
  const tIdeas = await getTranslations("ideas");

  return (
    <div className="space-y-4">
      {round.themes.map((theme) => (
        <Card key={theme.id}>
          <CardHeader>
            <CardTitle className="font-heading text-xl font-bold">{theme.title}</CardTitle>
            {theme.description && <CardDescription>{theme.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {theme.overview && <ThemeOverview overview={theme.overview} />}
            {theme.calendar && calendarHref && <AddToCalendar href={calendarHref(theme.id)} />}
            {theme.ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="space-y-2">
                {theme.ideas.map((idea) => (
                  <ExpandableListItem
                    key={idea.id}
                    // Zero score: neutral row, whatever the status.
                    tone={idea.score.net === 0 ? "neutral" : idea.qualified ? "positive" : "negative"}
                    meta={
                      (idea.isMine || idea.tied || comments?.[idea.id]) && (
                        <>
                          {idea.tied && (
                            <Badge variant="outline" className="border-highlight text-foreground">
                              <Equal data-icon="inline-start" />
                              {t("tied")}
                            </Badge>
                          )}
                          {idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{tIdeas("mine")}</Badge>}
                          {comments?.[idea.id] && (
                            <CountBadge label={tIdeas("comments.toggle", { count: comments[idea.id].length })} />
                          )}
                        </>
                      )
                    }
                    aside={
                      <StatusBadge
                        status={idea.qualified ? "retained" : "rejected"}
                        label={idea.qualified ? t("qualified") : t("notQualified")}
                      />
                    }
                    // Votes stay discreet: they expand on tap (or click, or keyboard).
                    details={
                      <div className="space-y-2">
                        {idea.mapQuery && <MapLink query={idea.mapQuery} label={tIdeas("mapLink")} />}
                        {theme.pointsBudget !== null ? (
                          // Points topic: the total alone, against the leading idea's.
                          <VoteSummary
                            up={idea.score.up}
                            down={0}
                            max={theme.ideas[0]?.score.up}
                            labels={{ up: t("points", { count: idea.score.up }) }}
                          />
                        ) : (
                          <VoteSummary
                            up={idea.score.up}
                            down={idea.score.down}
                            labels={{
                              up: t("votesUp", { count: idea.score.up }),
                              down: t("votesDown", { count: idea.score.down }),
                            }}
                          />
                        )}
                        {comments?.[idea.id] && (
                          <CommentThread
                            comments={comments[idea.id]}
                            labels={{ list: tIdeas("comments.list", { idea: idea.content }), mine: tIdeas("comments.mine") }}
                          />
                        )}
                      </div>
                    }
                  >
                    {idea.content}
                  </ExpandableListItem>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** "Common slot" or "compatible budget" overview above the topic's ideas. */
async function ThemeOverview({ overview }: { overview: RecapOverview }) {
  const t = await getTranslations("recap");
  const locale = await getLocale();
  const text = (await getOverviewText())(overview);
  const summary = <OverviewSummary common={text.common} summary={text.summary} detail={text.detail} />;

  if (overview.type === "dates") {
    return (
      <div className="space-y-3">
        {summary}
        <DateOverview
          periods={overview.periods}
          best={overview.best}
          locale={locale}
          labels={{
            view: t("viewLabel"),
            timeline: t("viewTimeline"),
            calendar: t("viewCalendar"),
            period: t("overviewPeriod"),
            overlap: t("overviewOverlap"),
            best: t("overviewBest"),
            days: t("overviewDays"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summary}
      <AmountOverview
        ranges={overview.ranges}
        best={overview.best}
        locale={locale}
        labels={{ range: t("overviewRange"), zone: t("overviewZone"), amounts: t("overviewAmounts") }}
      />
    </div>
  );
}

/**
 * The recap "topic by topic", as on the room screen: the kept idea in large, then every idea with
 * its votes. On someone's own device, so with previous / next buttons rather than moving on alone.
 */
export async function RecapRoundSpotlight({ round, calendarHref }: { round: RecapRound; calendarHref?: CalendarHref }) {
  const t = await getTranslations("present");
  const tRecap = await getTranslations("recap");
  const tView = await getTranslations("view");
  const total = round.themes.length;

  return (
    <PresentationCarousel
      label={t("results")}
      positions={round.themes.map((_, i) => t("topicPosition", { current: i + 1, total }))}
      controls={{ previous: tView("previous"), next: tView("next") }}
      slides={round.themes.map((theme) => {
        const winners = topQualified(theme.ideas).map((idea) => idea.content);
        return (
          // A slide fills the carousel: the result grows, the button stays under it.
          <div key={theme.id} className="flex min-h-0 flex-1 flex-col gap-4">
            <PresentationResult
              variant="page"
              topic={theme.title}
              winners={winners}
              verdict={winners.length === 0 ? t("noneKept") : winners.length > 1 ? t("tied") : t("kept")}
              pointsMax={theme.pointsBudget !== null ? (theme.ideas[0]?.score.up ?? 0) : undefined}
              ideas={theme.ideas.map((idea) => ({
                id: idea.id,
                content: idea.content,
                up: idea.score.up,
                down: idea.score.down,
                qualified: idea.qualified,
                votesLabel:
                  theme.pointsBudget !== null
                    ? t("points", { count: idea.score.up })
                    : t("votes", { up: idea.score.up, down: idea.score.down }),
                statusLabel: idea.qualified ? tRecap("qualified") : tRecap("notQualified"),
              }))}
            />
            {theme.calendar && calendarHref && <AddToCalendar href={calendarHref(theme.id)} />}
          </div>
        );
      })}
    />
  );
}

/** One round: its recap; several: a tab each, the latest one open. */
export async function RecapByRound({ rounds, render }: { rounds: RecapRound[]; render: (round: RecapRound) => React.ReactNode }) {
  const t = await getTranslations("recap");
  const current = rounds[rounds.length - 1];
  if (rounds.length === 1) return render(current);
  return (
    <Tabs defaultValue={String(current.round)}>
      <TabsList className="mb-4">
        {rounds.map((r) => (
          <TabsTrigger key={r.round} value={String(r.round)}>
            {t("roundTab", { round: r.round })}
          </TabsTrigger>
        ))}
      </TabsList>
      {rounds.map((r) => (
        <TabsContent key={r.round} value={String(r.round)} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          {render(r)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
