import { Equal } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ExpandableListItem } from "@/components/expandable-list-item";
import { StatusBadge } from "@/components/status-badge";
import { VoteSummary } from "@/components/vote-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecapRound } from "@/lib/room";

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
          <CardContent>
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
                      <VoteSummary
                        up={idea.score.up}
                        down={idea.score.down}
                        labels={{
                          up: t("votesUp", { count: idea.score.up }),
                          down: t("votesDown", { count: idea.score.down }),
                        }}
                      />
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
