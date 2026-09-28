import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RecapRound } from "@/lib/room";
import { cn } from "@/lib/utils";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export async function RecapRoundView({ round }: { round: RecapRound }) {
  const t = await getTranslations("recap");
  const tIdeas = await getTranslations("ideas");

  return (
    <div className="space-y-4">
      {round.themes.map((theme) => (
        <Card key={theme.id}>
          <CardHeader>
            <CardTitle className="text-lg">{theme.title}</CardTitle>
            {theme.description && <CardDescription>{theme.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {theme.ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {theme.ideas.map((idea) => {
                  const score = t("scoreTooltip", {
                    net: signed(idea.score.net),
                    up: idea.score.up,
                    down: idea.score.down,
                  });
                  return (
                    <li
                      key={idea.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                        // Score nul : ligne neutre, quel que soit le statut.
                        idea.score.net === 0
                          ? "border border-transparent bg-muted/60"
                          : idea.qualified
                            ? "border border-emerald-600/35 bg-emerald-600/10 dark:border-emerald-500/35 dark:bg-emerald-500/10"
                            : "border border-rose-600/35 bg-rose-600/10 dark:border-rose-500/35 dark:bg-rose-500/10",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm whitespace-pre-wrap break-words">{idea.content}</p>
                        {idea.isMine && <Badge variant="secondary">{tIdeas("mine")}</Badge>}
                      </div>
                      <Tooltip>
                        {/* Les votes ne sont pas affichés : ils apparaissent au survol (ou au focus) du statut. */}
                        <TooltipTrigger
                          render={<span tabIndex={0} aria-label={`${idea.qualified ? t("qualified") : t("notQualified")} · ${score}`} />}
                          className="inline-flex shrink-0 cursor-default self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:self-center"
                        >
                          {idea.qualified ? (
                            <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                              <Check data-icon="inline-start" />
                              {t("qualified")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-rose-600/45 text-rose-700 dark:border-rose-500/45 dark:text-rose-400"
                            >
                              <X data-icon="inline-start" />
                              {t("notQualified")}
                            </Badge>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>{score}</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
