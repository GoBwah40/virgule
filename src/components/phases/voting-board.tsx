"use client";

import { BellRing, Coins, ListChecks, MessageSquare, Pencil, Plus, Tags, TimerOff, Trash2, Vote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useOptimistic, useState, useTransition } from "react";

import { AmountField } from "@/components/amount-field";
import { BoardColumns } from "@/components/board-columns";
import { CommentThread } from "@/components/comment-thread";
import { ConfirmButton } from "@/components/confirm-button";
import { CooldownButton } from "@/components/cooldown-button";
import { CountBadge } from "@/components/count-badge";
import { DateField } from "@/components/date-field";
import { FormField } from "@/components/form-field";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { MapLink } from "@/components/map-link";
import { MasonryColumns } from "@/components/masonry-columns";
import { PointsStepper } from "@/components/points-stepper";
import { ScrollableList } from "@/components/scrollable-list";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { useView } from "@/components/phases/view-choice";
import { VoteButtons } from "@/components/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import {
  type ActionResult,
  addComment,
  addIdea,
  backToThemes,
  castVote,
  deleteComment,
  deleteIdea,
  extendTimer,
  goToRecap,
  goToRecapOnTimer,
  nudgeVoters,
  setPoints,
  stopTimer,
  updateIdea,
} from "@/lib/actions";
import { EXTEND_TIMER_MINUTES, LIMITS, MAX_COMMENTS_PER_IDEA } from "@/lib/config";
import type { IdeaFields, IdeaInput, ThemeKind } from "@/lib/idea-value";
import { pointsLeft } from "@/lib/results";
import { isBadServerResponse, isNetworkError } from "@/lib/network-error";
import type { ViewPreference } from "@/lib/view-preference";
import type { VotingIdea, VotingTheme } from "@/lib/room";
import { serverNow } from "@/lib/server-clock";
import { cn } from "@/lib/utils";

/**
 * Every topic with its ideas, as a list (two columns of cards) or as a board (one column per
 * topic, like the room screen), as picked in the page header.
 */
export function IdeasBoard({
  slug,
  themes,
  allowNewIdeas,
  hostName,
}: {
  slug: string;
  themes: VotingTheme[];
  allowNewIdeas: boolean;
  hostName: string;
}) {
  const [view] = useView();
  const blocks = themes.map((theme) => (
    <ThemeIdeas key={theme.id} slug={slug} theme={theme} allowNewIdeas={allowNewIdeas} hostName={hostName} variant={view} />
  ));

  return view === "board" ? <BoardColumns>{blocks}</BoardColumns> : <MasonryColumns>{blocks}</MasonryColumns>;
}

function ThemeIdeas({
  slug,
  theme,
  allowNewIdeas,
  hostName,
  variant = "list",
}: {
  slug: string;
  theme: VotingTheme;
  allowNewIdeas: boolean;
  hostName: string;
  /** `board`: a column of the board, idea input on top and the latest ideas first. */
  variant?: ViewPreference;
}) {
  const t = useTranslations("ideas");
  const tThemes = useTranslations("themes");
  const board = variant === "board";
  // Single-answer list: the choice is held here so picking an idea un-picks the previous one at once.
  const [pending, run] = useAction();
  const [chosenId, setOptimisticChoice] = useOptimistic(theme.ideas.find((idea) => idea.myVote === true)?.id ?? null);
  const pick = (ideaId: string, next: boolean | null) =>
    run(async () => {
      setOptimisticChoice(next ? ideaId : null);
      return castVote(slug, ideaId, next);
    });
  // Points topic: held here too, so the points left move as soon as one idea gets or loses one.
  const [myPoints, setOptimisticPoints] = useOptimistic(
    Object.fromEntries(theme.ideas.map((idea) => [idea.id, idea.myPoints])),
    (state: Record<string, number>, change: { ideaId: string; points: number }) => ({ ...state, [change.ideaId]: change.points }),
  );
  const budget = theme.pointsBudget;
  const left = budget === null ? null : pointsLeft(budget, Object.values(myPoints));
  const givePoints = (ideaId: string, points: number) =>
    run(async () => {
      setOptimisticPoints({ ideaId, points });
      return setPoints(slug, ideaId, points);
    });
  // Limited topic: "for" votes left to the current participant.
  const votesLeft =
    theme.maxVotes === null ? null : theme.maxVotes - theme.ideas.filter((idea) => idea.myVote === true).length;
  // Only the ideas you can vote on count (not your own when self-voting is off). A single-answer
  // list counts as one vote: picking one option is enough. Once a limited topic's "for" votes
  // are used up, it counts as done, like the page meter.
  const votable = theme.ideas.filter((idea) => idea.canVote);
  const votedIdeas = votable.filter((idea) => idea.myVote !== null).length;
  // A points topic has no "voted" count: its points left say it (see below).
  const [voted, total] = budget !== null
    ? [0, 0]
    : theme.singleChoice
    ? [Math.min(votedIdeas, 1), Math.min(votable.length, 1)]
    : [votesLeft !== null && votesLeft <= 0 ? votable.length : votedIdeas, votable.length];

  // Tiebreak round: we vote again on the tied ideas, with no new ideas.
  // Closed list: we only vote on the host's options.
  const composer =
    allowNewIdeas && theme.acceptsIdeas ? (
      <IdeaComposer slug={slug} themeId={theme.id} kind={theme.kind} />
    ) : (
      <p className="text-sm text-muted-foreground">{allowNewIdeas ? t("optionsBy", { host: hostName }) : t("tiebreakNoComposer")}</p>
    );
  // On the board, the latest ideas first, right under the input: what was just suggested shows.
  const ideas = board ? [...theme.ideas].reverse() : theme.ideas;

  return (
    <Card className={cn(board && "h-full")}>
      <CardHeader>
        {/* Breaks between words only: a narrow column never cuts a title in the middle of one. */}
        <CardTitle className="font-heading text-xl font-bold wrap-break-word hyphens-auto">{theme.title}</CardTitle>
        {theme.description && <CardDescription>{theme.description}</CardDescription>}
        {(theme.kind !== "TEXT" || theme.ideas.length > 0 || votesLeft !== null || budget !== null) && (
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
            {votesLeft !== null && theme.maxVotes !== null && (
              <IconBadge
                className={votesLeft <= 0 ? "border-highlight bg-highlight-soft text-highlight-foreground" : undefined}
                icon={Vote}
                label={t("votesLeft", { left: Math.max(0, votesLeft), max: theme.maxVotes })}
              />
            )}
            {left !== null && budget !== null && (
              <IconBadge
                className={left <= 0 ? "border-highlight bg-highlight-soft text-highlight-foreground" : undefined}
                icon={Coins}
                label={t("pointsLeft", { left, max: budget })}
              />
            )}
          </div>
        )}
        {theme.singleChoice && <p className="text-sm text-muted-foreground">{t("singleChoiceHint")}</p>}
        {budget !== null && <p className="text-sm text-muted-foreground">{t("pointsHint", { count: budget })}</p>}
      </CardHeader>
      {board && <div className="border-y bg-muted/50 px-4 py-3">{composer}</div>}
      <CardContent className={cn(board && "flex-1")}>
        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ScrollableList label={t("listLabel", { title: theme.title })}>
            {ideas.map((idea) => (
              <IdeaItem
                key={idea.id}
                slug={slug}
                kind={theme.kind}
                idea={idea}
                pick={
                  theme.singleChoice
                    ? { chosen: chosenId === idea.id, pending, onChange: (next) => pick(idea.id, next) }
                    : undefined
                }
                points={
                  left !== null
                    ? {
                        value: myPoints[idea.id] ?? 0,
                        max: (myPoints[idea.id] ?? 0) + left,
                        pending,
                        onChange: (next) => givePoints(idea.id, next),
                      }
                    : undefined
                }
                upDisabledReason={votesLeft !== null && votesLeft <= 0 ? t("voteLimitReached") : undefined}
              />
            ))}
          </ScrollableList>
        )}
      </CardContent>
      {!board && <CardFooter className="border-t bg-muted/50 py-3">{composer}</CardFooter>}
    </Card>
  );
}

const EMPTY_DATES = { start: "", end: "" };
const EMPTY_AMOUNTS = { min: "", max: "" };

/** Adds an idea to a topic. */
function IdeaComposer({ slug, themeId, kind }: { slug: string; themeId: string; kind: ThemeKind }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <IdeaForm
      idPrefix={`idea-${themeId}`}
      kind={kind}
      pending={pending}
      submitLabel={t("add")}
      onSubmit={(input, reset) => run(() => addIdea(slug, themeId, input), reset)}
    />
  );
}

/** Raw values of an idea → the fields' text. */
const formValues = (value: IdeaFields | undefined) => ({
  content: value?.content ?? "",
  dates: value?.dateStart ? { start: value.dateStart, end: value.dateEnd ?? "" } : EMPTY_DATES,
  amounts: value?.amountMin != null ? { min: String(value.amountMin), max: value.amountMax != null ? String(value.amountMax) : "" } : EMPTY_AMOUNTS,
});

/** Idea input matching the topic kind: text, date, period, amount or range. */
function IdeaForm({
  idPrefix,
  kind,
  initial,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
  hint,
  fieldLabel,
}: {
  idPrefix: string;
  kind: ThemeKind;
  /** Changing an idea: its current value. */
  initial?: IdeaFields;
  pending: boolean;
  submitLabel: string;
  onSubmit: (input: IdeaInput, reset: () => void) => void;
  /** Changing an idea: a way back without saving. */
  onCancel?: { label: string; run: () => void };
  hint?: string;
  /** Name of the text field (its placeholder by default). */
  fieldLabel?: string;
}) {
  const t = useTranslations("ideas");
  const tErrors = useTranslations("errors");
  const [content, setContent] = useState(() => formValues(initial).content);
  const [dates, setDates] = useState(() => formValues(initial).dates);
  const [amounts, setAmounts] = useState(() => formValues(initial).amounts);

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

  // A range typed the wrong way round: say why the button stays disabled.
  const rangeError =
    kind === "DATE_RANGE" && dates.start && dates.end && dates.end < dates.start
      ? tErrors("invalidDateRange")
      : kind === "AMOUNT_RANGE" && amounts.min && amounts.max && Number(amounts.max) < Number(amounts.min)
        ? tErrors("invalidAmountRange")
        : undefined;

  const submit = () => {
    if (!input) return;
    onSubmit(input, () => {
      setContent("");
      setDates(EMPTY_DATES);
      setAmounts(EMPTY_AMOUNTS);
    });
  };

  const submitButton = (
    <Button type="submit" disabled={pending || !input} className="sm:self-end">
      {submitLabel}
    </Button>
  );
  // Changing an idea: the buttons go under the field, which keeps its full width.
  const stacked = onCancel !== undefined;
  const button = onCancel ? (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" disabled={pending} onClick={onCancel.run}>
        {onCancel.label}
      </Button>
      {submitButton}
    </div>
  ) : (
    submitButton
  );

  const form = (
    <form
      className={cn(
        "flex w-full gap-2",
        stacked
          ? "flex-col"
          : kind === "TEXT" || kind === "CHOICE"
            ? "items-end"
            : kind !== "PLACE" && "flex-col sm:flex-row sm:items-end",
      )}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {kind === "PLACE" && (
        <FormField
          id={`${idPrefix}-place`}
          label={t("place")}
          hint={t("placeHint")}
          action={stacked ? undefined : button}
          className="min-w-0 flex-1"
        >
          <Input
            id={`${idPrefix}-place`}
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
          aria-label={fieldLabel ?? t("placeholder")}
          placeholder={t("placeholder")}
          autoFocus={initial !== undefined}
          maxLength={LIMITS.idea}
          rows={1}
          className="min-h-11"
        />
      )}
      {(kind === "DATE" || kind === "DATE_RANGE") && (
        <div className="min-w-0 flex-1">
          <DateField
            mode={kind === "DATE" ? "single" : "range"}
            idPrefix={idPrefix}
            value={dates}
            onChange={setDates}
            labels={{ date: t("date"), from: t("dateFrom"), to: t("dateTo") }}
            error={rangeError}
          />
        </div>
      )}
      {(kind === "AMOUNT" || kind === "AMOUNT_RANGE") && (
        <div className="min-w-0 flex-1">
          <AmountField
            mode={kind === "AMOUNT" ? "single" : "range"}
            idPrefix={idPrefix}
            value={amounts}
            onChange={setAmounts}
            labels={{ amount: t("amount"), min: t("amountMin"), max: t("amountMax"), currency: t("currency") }}
            error={rangeError}
          />
        </div>
      )}
      {(kind !== "PLACE" || stacked) && button}
    </form>
  );
  if (!hint) return form;
  return (
    <div className="w-full space-y-2">
      {form}
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function IdeaItem({
  slug,
  kind,
  idea,
  pick,
  points,
  upDisabledReason,
}: {
  slug: string;
  kind: ThemeKind;
  idea: VotingIdea;
  /** Single-answer list: the choice is handled by the topic, across its ideas. */
  pick?: { chosen: boolean; pending: boolean; onChange: (next: boolean | null) => void };
  /** Points topic: the points are handled by the topic, which holds the budget. */
  points?: { value: number; max: number; pending: boolean; onChange: (next: number) => void };
  /** No "for" votes left in the topic. */
  upDisabledReason?: string;
}) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  const [commentPending, runComment] = useAction();
  // Shows the vote immediately; reverts to the server value on error.
  const [vote, setOptimisticVote] = useOptimistic(idea.myVote);
  const [editing, setEditing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const commentsId = useId();
  // The edit window closes on its own, page open or not (the server checks it again).
  const [windowOver, setWindowOver] = useState<string | null>(null);
  const until = idea.edit?.until;
  useEffect(() => {
    if (!until) return;
    const timer = setTimeout(() => setWindowOver(until), Math.max(0, new Date(until).getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [until]);
  const edit = idea.edit && windowOver !== idea.edit.until ? idea.edit : null;

  if (editing && edit) {
    return (
      <li className="py-3">
        <IdeaForm
          idPrefix={`edit-${idea.id}`}
          kind={kind}
          initial={edit.value}
          pending={pending}
          submitLabel={t("editSave")}
          fieldLabel={t("edit")}
          hint={t("editHint")}
          onCancel={{ label: t("editCancel"), run: () => setEditing(false) }}
          onSubmit={(input) => run(() => updateIdea(slug, idea.id, input), () => setEditing(false))}
        />
      </li>
    );
  }

  return (
    <ListItem
      className={pending || pick?.pending || points?.pending ? "opacity-80" : undefined}
      meta={
        <>
          {idea.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{t("mine")}</Badge>}
          {!idea.isNew && <Badge variant="outline">{t("carriedOver")}</Badge>}
          {/* Votes were reset with the change: everyone sees why theirs is gone. */}
          {idea.edited && <Badge variant="outline">{t("edited")}</Badge>}
          {idea.mapQuery && <MapLink query={idea.mapQuery} label={t("mapLink")} />}
          {(edit || idea.canDelete) && (
            // 20 px apart: the 44 px touch areas of the two small buttons do not overlap.
            <span className="inline-flex gap-5">
              {edit && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="touch-target"
                  aria-label={t("edit")}
                  title={t("edit")}
                  disabled={pending}
                  onClick={() => setEditing(true)}
                >
                  <Pencil />
                </Button>
              )}
              {idea.canDelete && (
                // Its votes go with it: asked first, like a topic with ideas.
                <ConfirmButton
                  variant="ghost"
                  size="icon-xs"
                  // Small next to the badges, 44 px to tap.
                  className="touch-target"
                  aria-label={t("delete")}
                  disabled={pending}
                  title={t("deleteConfirm")}
                  description={t("deleteConfirmHint")}
                  confirmLabel={t("delete")}
                  destructive
                  onConfirm={() => run(() => deleteIdea(slug, idea.id))}
                >
                  <Trash2 />
                </ConfirmButton>
              )}
            </span>
          )}
          {/* Comments stay folded: the count shows, the list and the input open on demand. */}
          {idea.comments && (
            <Button
              variant="ghost"
              size="xs"
              className="touch-target ms-1.5 text-muted-foreground"
              aria-expanded={commentsOpen}
              aria-controls={commentsOpen ? commentsId : undefined}
              onClick={() => setCommentsOpen((open) => !open)}
            >
              <MessageSquare data-icon="inline-start" />
              {t("comments.toggle", { count: idea.comments.length })}
            </Button>
          )}
        </>
      }
      below={
        commentsOpen &&
        idea.comments && (
          <div id={commentsId}>
            <CommentThread
              comments={idea.comments}
              labels={{
                list: t("comments.list", { idea: idea.content }),
                mine: t("comments.mine"),
                remove: t("comments.remove"),
                moderate: { button: t("comments.moderate"), title: t("comments.moderateConfirm"), description: t("comments.moderateHint") },
              }}
              onDelete={(commentId) => runComment(() => deleteComment(slug, commentId))}
              form={{
                label: t("comments.label"),
                placeholder: t("comments.placeholder"),
                submit: t("comments.submit"),
                maxLength: LIMITS.comment,
                pending: commentPending,
                disabledReason: idea.canComment ? undefined : t("comments.limitReached", { max: MAX_COMMENTS_PER_IDEA }),
                onSubmit: (content, reset) => runComment(() => addComment(slug, idea.id, content), reset),
              }}
            />
          </div>
        )
      }
      actions={
        points ? (
          <PointsStepper
            value={points.value}
            max={points.max}
            labels={{
              decrease: t("pointsLess"),
              increase: t("pointsMore"),
              value: t("pointsValue", { count: points.value }),
              group: t("pointsGroup"),
            }}
            disabledReason={idea.canVote ? undefined : t("selfVoteDisabled")}
            increaseDisabledReason={t("pointsBudgetReached")}
            onChange={points.onChange}
          />
        ) : pick ? (
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
            upDisabledReason={upDisabledReason}
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

/** Host: reminds whoever still has ideas left without their vote, without knowing who. */
export function NudgeButton({ slug, availableAt }: { slug: string; availableAt: string | null }) {
  const t = useTranslations("ideas");
  const [pending, run] = useAction();
  return (
    <CooldownButton
      icon={BellRing}
      label={t("nudge")}
      doneLabel={t("nudgeSent")}
      availableAt={availableAt}
      pending={pending}
      onClick={() => run(() => nudgeVoters(slug))}
    />
  );
}

// Errors worth asking again for: this browser's clock a little ahead of the server's, or a
// server too busy to answer. Any other one (the step already changed…) ends it.
const RETRY_ERRORS = new Set(["timerRunning", "tooManyRequests", "unknown"]);
const MAX_ATTEMPTS = 5;

/**
 * The host chose to move on when time is up: says so, and asks the server once the timer runs
 * out. Every page asks, so the session moves on even if the host's phone is asleep; the server
 * checks its own clock and only the first request changes the step.
 */
export function AutoRecap({ slug, endsAt }: { slug: string; endsAt: string }) {
  const t = useTranslations("ideas");
  const [, startTransition] = useTransition();

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const ask = () =>
      startTransition(async () => {
        let result: ActionResult | void | null;
        try {
          result = await goToRecapOnTimer(slug);
        } catch (error) {
          if (navigator.onLine && !isNetworkError(error) && !isBadServerResponse(error)) throw error;
          result = null;
        }
        // Nothing back: the action redirected to the recap.
        const again = result === null || (result && !result.ok && RETRY_ERRORS.has(result.error));
        if (again && ++attempts < MAX_ATTEMPTS) timer = setTimeout(ask, 3000);
      });
    // Up to a second and a half later: not every page at the same instant.
    // The end is a server time: waited for on the server's clock, whatever the device's says.
    timer = setTimeout(ask, Math.max(0, new Date(endsAt).getTime() - serverNow()) + Math.random() * 1500);
    return () => clearTimeout(timer);
  }, [slug, endsAt]);

  return <p className="text-sm text-muted-foreground">{t("autoRecapNotice")}</p>;
}
