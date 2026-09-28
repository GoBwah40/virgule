import { getTranslations } from "next-intl/server";

import { ListItem } from "@/components/list-item";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecapRound } from "@/lib/room";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

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
                  <ListItem
                    key={idea.id}
                    // Score nul : ligne neutre, quel que soit le statut.
                    tone={idea.score.net === 0 ? "neutral" : idea.qualified ? "positive" : "negative"}
                    meta={idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{tIdeas("mine")}</Badge>}
                    actions={
                      // Les votes ne sont pas affichés : ils apparaissent au survol (ou au tap) du statut.
                      <StatusBadge
                        status={idea.qualified ? "retained" : "rejected"}
                        label={idea.qualified ? t("qualified") : t("notQualified")}
                        tooltip={t("scoreTooltip", { net: signed(idea.score.net), up: idea.score.up, down: idea.score.down })}
                      />
                    }
                  >
                    {idea.content}
                  </ListItem>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
