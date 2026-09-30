import { Equal } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { AmountOverview } from "@/components/amount-overview";
import { DateOverview } from "@/components/date-overview";
import { ExpandableListItem } from "@/components/expandable-list-item";
import { MapLink } from "@/components/map-link";
import { OverviewSummary } from "@/components/overview-summary";
import { StatusBadge } from "@/components/status-badge";
import { VoteSummary } from "@/components/vote-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewText } from "@/lib/overview-format";
import type { RecapOverview, RecapRound } from "@/lib/room";

export async function RecapRoundView({ round }: { round: RecapRound }) {
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
            {theme.ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="space-y-2">
                {theme.ideas.map((idea) => (
                  <ExpandableListItem
                    key={idea.id}
                    // Score nul : ligne neutre, quel que soit le statut.
                    tone={idea.score.net === 0 ? "neutral" : idea.qualified ? "positive" : "negative"}
                    meta={
                      (idea.isMine || idea.tied) && (
                        <>
                          {idea.tied && (
                            <Badge variant="outline" className="border-highlight text-foreground">
                              <Equal data-icon="inline-start" />
                              {t("tied")}
                            </Badge>
                          )}
                          {idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{tIdeas("mine")}</Badge>}
                        </>
                      )
                    }
                    aside={
                      <StatusBadge
                        status={idea.qualified ? "retained" : "rejected"}
                        label={idea.qualified ? t("qualified") : t("notQualified")}
                      />
                    }
                    // Les votes restent discrets : ils se déplient au toucher (ou au clic, au clavier).
                    details={
                      <div className="space-y-2">
                        {idea.mapQuery && <MapLink query={idea.mapQuery} label={tIdeas("mapLink")} />}
                        <VoteSummary
                        up={idea.score.up}
                        down={idea.score.down}
                        labels={{
                          up: t("votesUp", { count: idea.score.up }),
                          down: t("votesDown", { count: idea.score.down }),
                        }}
                      />
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

/** Synthèse « créneau commun » ou « budget compatible » au-dessus des idées du sujet. */
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
