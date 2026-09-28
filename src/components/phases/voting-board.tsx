"use client";

import { ListChecks, Tags, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { ListItem } from "@/components/list-item";
import { VoteButtons } from "@/components/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addIdea, backToThemes, castVote, deleteIdea, goToRecap } from "@/lib/actions";
import { LIMITS } from "@/lib/config";
import type { VotingIdea, VotingTheme } from "@/lib/room";

export function ThemeIdeas({ slug, theme }: { slug: string; theme: VotingTheme }) {
  const t = useTranslations("ideas");
  const [content, setContent] = useState("");
  const [pending, run] = useAction();

  const submit = () => run(() => addIdea(slug, theme.id, { content }), () => setContent(""));

  return (
    <Card>
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
              <IdeaItem key={idea.id} slug={slug} idea={idea} />
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 py-3">
        <form
          className="flex w-full items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              // Entrée pour envoyer, Maj+Entrée pour un retour à la ligne.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (content.trim()) submit();
              }
            }}
            aria-label={t("placeholder")}
            placeholder={t("placeholder")}
            maxLength={LIMITS.idea}
            rows={1}
            className="min-h-11"
          />
          <Button type="submit" disabled={pending || !content.trim()}>
            {t("add")}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function IdeaItem({ slug, idea }: { slug: string; idea: VotingIdea }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  // Affiche le vote immédiatement ; revient à la valeur serveur en cas d'erreur.
  const [vote, setOptimisticVote] = useOptimistic(idea.myVote);

  return (
    <ListItem
      className={pending ? "opacity-80" : undefined}
      meta={
        (idea.isMine || !idea.isNew) && (
          <>
            {idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{t("mine")}</Badge>}
            {!idea.isNew && <Badge variant="outline">{t("carriedOver")}</Badge>}
            {idea.isMine && idea.isNew && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("delete")}
                title={t("delete")}
                disabled={pending}
                onClick={() => run(() => deleteIdea(slug, idea.id))}
              >
                <Trash2 />
              </Button>
            )}
          </>
        )
      }
      actions={
        <VoteButtons
          value={vote}
          labels={{ up: t("voteUp"), down: t("voteDown") }}
          disabledReason={idea.canVote ? undefined : t("selfVoteDisabled")}
          onChange={(next) =>
            run(async () => {
              setOptimisticVote(next);
              return castVote(slug, idea.id, next);
            })
          }
        />
      }
    >
      {idea.content}
    </ListItem>
  );
}

export function BackToThemesButton({ slug }: { slug: string }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      variant="outline"
      disabled={pending}
      title={t("backToThemesConfirm")}
      description={t("backToThemesHint")}
      confirmLabel={t("backToThemes")}
      onConfirm={() => run(() => backToThemes(slug))}
    >
      <Tags data-icon="inline-start" />
      {t("backToThemes")}
    </ConfirmButton>
  );
}

export function FinishVotingButton({ slug }: { slug: string }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      disabled={pending}
      title={t("finishConfirm")}
      confirmLabel={t("finish")}
      onConfirm={() => run(() => goToRecap(slug))}
    >
      <ListChecks data-icon="inline-start" />
      {t("finish")}
    </ConfirmButton>
  );
}
