"use client";

import { ListChecks, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { addIdea, castVote, deleteIdea, goToRecap } from "@/lib/actions";
import { LIMITS } from "@/lib/config";
import type { VotingIdea, VotingTheme } from "@/lib/room";
import { cn } from "@/lib/utils";

export function ThemeIdeas({ slug, theme }: { slug: string; theme: VotingTheme }) {
  const t = useTranslations("ideas");
  const [content, setContent] = useState("");
  const [pending, run] = useAction();

  const submit = () => run(() => addIdea(slug, theme.id, { content }), () => setContent(""));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{theme.title}</CardTitle>
        {theme.description && <CardDescription>{theme.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        {theme.ideas.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        {theme.ideas.map((idea) => (
          <IdeaItem key={idea.id} slug={slug} idea={idea} />
        ))}
      </CardContent>
      <CardFooter className="border-t bg-muted/40 py-3">
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
            placeholder={t("placeholder")}
            maxLength={LIMITS.idea}
            rows={1}
            className="min-h-9 bg-background"
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

  const toggle = (positive: boolean) => {
    const next = vote === positive ? null : positive;
    run(async () => {
      setOptimisticVote(next);
      return castVote(slug, idea.id, next);
    });
  };

  const voteButtons = (
    <div className="flex shrink-0 gap-1">
      <Button
        variant={vote === true ? "default" : "outline"}
        size="sm"
        aria-pressed={vote === true}
        disabled={!idea.canVote}
        onClick={() => toggle(true)}
        className={cn(vote === true && "bg-emerald-600 hover:bg-emerald-600/90")}
      >
        <ThumbsUp data-icon="inline-start" />
        {t("voteUp")}
      </Button>
      <Button
        variant={vote === false ? "default" : "outline"}
        size="sm"
        aria-pressed={vote === false}
        disabled={!idea.canVote}
        onClick={() => toggle(false)}
        className={cn(vote === false && "bg-rose-600 hover:bg-rose-600/90")}
      >
        <ThumbsDown data-icon="inline-start" />
        {t("voteDown")}
      </Button>
    </div>
  );

  return (
    <div className={cn("rounded-lg border bg-background p-3", pending && "opacity-80")}>
      <p className="text-sm whitespace-pre-wrap break-words">{idea.content}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {idea.isMine && <Badge variant="secondary">{t("mine")}</Badge>}
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
        </div>
        {idea.canVote ? (
          voteButtons
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} />}>{voteButtons}</TooltipTrigger>
            <TooltipContent>{t("selfVoteDisabled")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function FinishVotingButton({ slug }: { slug: string }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      size="lg"
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
