"use client";

import { ListChecks, Plus, Tags, TimerOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState } from "react";

import { AmountField } from "@/components/amount-field";
import { ConfirmButton } from "@/components/confirm-button";
import { CountBadge } from "@/components/count-badge";
import { DateField } from "@/components/date-field";
import { FormField } from "@/components/form-field";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { MapLink } from "@/components/map-link";
import { ScrollableList } from "@/components/scrollable-list";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { VoteButtons } from "@/components/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addIdea, backToThemes, castVote, deleteIdea, extendTimer, goToRecap, stopTimer } from "@/lib/actions";
import { EXTEND_TIMER_MINUTES, LIMITS } from "@/lib/config";
import type { IdeaInput, ThemeKind } from "@/lib/idea-value";
import type { VotingIdea, VotingTheme } from "@/lib/room";
import { cn } from "@/lib/utils";

export function ThemeIdeas({
  slug,
  theme,
  allowNewIdeas,
  hostName,
}: {
  slug: string;
  theme: VotingTheme;
  allowNewIdeas: boolean;
  hostName: string;
}) {
  const t = useTranslations("ideas");
  const tThemes = useTranslations("themes");
  // Only the ideas you can vote on count (not your own when self-voting is off). A single-answer
  // list counts as one vote: picking one option is enough.
  const votable = theme.ideas.filter((idea) => idea.canVote);
  const votedIdeas = votable.filter((idea) => idea.myVote !== null).length;
  const [voted, total] = theme.singleChoice
    ? [Math.min(votedIdeas, 1), Math.min(votable.length, 1)]
    : [votedIdeas, votable.length];
  // Single-answer list: the choice is held here so picking an idea un-picks the previous one at once.
  const [pending, run] = useAction();
  const [chosenId, setOptimisticChoice] = useOptimistic(theme.ideas.find((idea) => idea.myVote === true)?.id ?? null);
  const pick = (ideaId: string, next: boolean | null) =>
    run(async () => {
      setOptimisticChoice(next ? ideaId : null);
      return castVote(slug, ideaId, next);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">{theme.title}</CardTitle>
        {theme.description && <CardDescription>{theme.description}</CardDescription>}
        {(theme.kind !== "TEXT" || theme.ideas.length > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {theme.kind !== "TEXT" && (
              <IconBadge icon={THEME_KIND_ICONS[theme.kind]} label={tThemes(`kinds.${theme.kind}`)} />
            )}
            {theme.ideas.length > 0 && <CountBadge label={t("ideaCount", { count: theme.ideas.length })} />}
            {total > 0 && (
              <CountBadge
                label={t("votedCount", { done: voted, total })}
                tone={voted === total ? "complete" : "progress"}
              />
            )}
          </div>
        )}
        {theme.singleChoice && <p className="text-sm text-muted-foreground">{t("singleChoiceHint")}</p>}
      </CardHeader>
      <CardContent>
        {theme.ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ScrollableList label={t("listLabel", { title: theme.title })}>
            {theme.ideas.map((idea) => (
              <IdeaItem
                key={idea.id}
                slug={slug}
                idea={idea}
                pick={
                  theme.singleChoice
                    ? { chosen: chosenId === idea.id, pending, onChange: (next) => pick(idea.id, next) }
                    : undefined
                }
              />
            ))}
          </ScrollableList>
        )}
      </CardContent>
      {/* Tiebreak round: we vote again on the tied ideas, with no new ideas.
          Closed list: we only vote on the host's options. */}
      {allowNewIdeas && theme.acceptsIdeas ? (
        <CardFooter className="border-t bg-muted/50 py-3">
          <IdeaComposer slug={slug} themeId={theme.id} kind={theme.kind} />
        </CardFooter>
      ) : (
        <CardFooter className="border-t bg-muted/50 py-3 text-sm text-muted-foreground">
          {allowNewIdeas ? t("optionsBy", { host: hostName }) : t("tiebreakNoComposer")}
        </CardFooter>
      )}
    </Card>
  );
}

const EMPTY_DATES = { start: "", end: "" };
const EMPTY_AMOUNTS = { min: "", max: "" };

/** Idea input matching the topic kind: text, date, period, amount or range. */
function IdeaComposer({ slug, themeId, kind }: { slug: string; themeId: string; kind: ThemeKind }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  const [content, setContent] = useState("");
  const [dates, setDates] = useState(EMPTY_DATES);
  const [amounts, setAmounts] = useState(EMPTY_AMOUNTS);

  // Client-side validation to enable the button; the server validates again (parseIdeaInput).
  const input: IdeaInput | null = (() => {
    switch (kind) {
      case "TEXT":
      case "PLACE":
      case "CHOICE":
        return content.trim() ? { content } : null;
      case "DATE":
        return dates.start ? { dateStart: dates.start } : null;
      case "DATE_RANGE":
        return dates.start && dates.end && dates.end >= dates.start
          ? { dateStart: dates.start, dateEnd: dates.end }
          : null;
      case "AMOUNT":
        return amounts.min ? { amountMin: Number(amounts.min) } : null;
      case "AMOUNT_RANGE":
        return amounts.min && amounts.max && Number(amounts.max) >= Number(amounts.min)
          ? { amountMin: Number(amounts.min), amountMax: Number(amounts.max) }
          : null;
    }
  })();

  const submit = () => {
    if (!input) return;
    run(
      () => addIdea(slug, themeId, input),
      () => {
        setContent("");
        setDates(EMPTY_DATES);
        setAmounts(EMPTY_AMOUNTS);
      },
    );
  };

  const button = (
    <Button type="submit" disabled={pending || !input} className="sm:self-end">
      {t("add")}
    </Button>
  );

  return (
    <form
      className={cn(
        "flex w-full gap-2",
        kind === "TEXT" || kind === "CHOICE" ? "items-end" : kind !== "PLACE" && "flex-col sm:flex-row sm:items-end",
      )}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {kind === "PLACE" && (
        <FormField
          id={`idea-${themeId}-place`}
          label={t("place")}
          hint={t("placeHint")}
          action={button}
          className="min-w-0 flex-1"
        >
          <Input
            id={`idea-${themeId}-place`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("placePlaceholder")}
            maxLength={LIMITS.idea}
            autoComplete="off"
          />
        </FormField>
      )}
      {(kind === "TEXT" || kind === "CHOICE") && (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            // Enter to send, Shift+Enter for a line break.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
          maxLength={LIMITS.idea}
          rows={1}
          className="min-h-11"
        />
      )}
      {(kind === "DATE" || kind === "DATE_RANGE") && (
        <div className="min-w-0 flex-1">
          <DateField
            mode={kind === "DATE" ? "single" : "range"}
            idPrefix={`idea-${themeId}`}
            value={dates}
            onChange={setDates}
            labels={{ date: t("date"), from: t("dateFrom"), to: t("dateTo") }}
          />
        </div>
      )}
      {(kind === "AMOUNT" || kind === "AMOUNT_RANGE") && (
        <div className="min-w-0 flex-1">
          <AmountField
            mode={kind === "AMOUNT" ? "single" : "range"}
            idPrefix={`idea-${themeId}`}
            value={amounts}
            onChange={setAmounts}
            labels={{ amount: t("amount"), min: t("amountMin"), max: t("amountMax"), currency: t("currency") }}
          />
        </div>
      )}
      {kind !== "PLACE" && button}
    </form>
  );
}

function IdeaItem({
  slug,
  idea,
  pick,
}: {
  slug: string;
  idea: VotingIdea;
  /** Single-answer list: the choice is handled by the topic, across its ideas. */
  pick?: { chosen: boolean; pending: boolean; onChange: (next: boolean | null) => void };
}) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  // Shows the vote immediately; reverts to the server value on error.
  const [vote, setOptimisticVote] = useOptimistic(idea.myVote);

  return (
    <ListItem
      className={pending || pick?.pending ? "opacity-80" : undefined}
      meta={
        (idea.isMine || !idea.isNew || idea.canDelete || idea.mapQuery) && (
          <>
            {idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{t("mine")}</Badge>}
            {!idea.isNew && <Badge variant="outline">{t("carriedOver")}</Badge>}
            {idea.mapQuery && <MapLink query={idea.mapQuery} label={t("mapLink")} />}
            {idea.canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                // Small next to the badges, 44 px to tap.
                className="touch-target"
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
        pick ? (
          <VoteButtons
            mode="pick"
            value={pick.chosen || null}
            labels={{ up: t("pick") }}
            disabledReason={idea.canVote ? undefined : t("selfVoteDisabled")}
            onChange={pick.onChange}
          />
        ) : (
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
        )
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

/** Host buttons for the running timer. */
export function TimerControls({ slug }: { slug: string }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <div className="flex gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run(() => extendTimer(slug))}>
        <Plus data-icon="inline-start" />
        {t("timerExtend", { count: EXTEND_TIMER_MINUTES })}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("timerStop")}
        title={t("timerStop")}
        disabled={pending}
        onClick={() => run(() => stopTimer(slug))}
      >
        <TimerOff />
      </Button>
    </div>
  );
}
