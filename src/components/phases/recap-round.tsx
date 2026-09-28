import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecapRound } from "@/lib/room";
import { cn } from "@/lib/utils";

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
              <ol className="divide-y">
                {theme.ideas.map((idea) => (
                  <li
                    key={idea.id}
                    className={cn(
                      "flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3",
                      !idea.qualified && "opacity-60",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm whitespace-pre-wrap break-words">{idea.content}</p>
                      {idea.isMine && <Badge variant="secondary">{tIdeas("mine")}</Badge>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400">{t("up", { count: idea.score.up })}</span>
                      <span className="text-rose-700 dark:text-rose-400">{t("down", { count: idea.score.down })}</span>
                      <span className="font-medium tabular-nums">{t("net", { net: idea.score.net })}</span>
                      {idea.qualified ? (
                        <Badge>
                          <Check data-icon="inline-start" />
                          {t("qualified")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <X data-icon="inline-start" />
                          {t("notQualified")}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
