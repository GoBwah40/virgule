"use client";

import { ArrowDown, ArrowUp, Coins, Pencil, Play, Trash2, Vote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BoardColumns } from "@/components/board-columns";
import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { OptionListField } from "@/components/option-list-field";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { useView } from "@/components/phases/view-choice";
import { SegmentedControl } from "@/components/segmented-control";
import { SettingSwitch } from "@/components/setting-switch";
import { SuggestionChips } from "@/components/suggestion-chips";
import { TopicCard } from "@/components/topic-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addTheme, deleteTheme, moveTheme, setAllowSelfVote, setAutoRecap, setIdeasTimer, setRoomSize, startIdeasPhase, updateTheme } from "@/lib/actions";
import { DEFAULT_POINTS_BUDGET, IDEAS_TIMER_OPTIONS, LIMITS, POINTS_BUDGET_OPTIONS, ROOM_SIZES, VOTE_LIMIT_OPTIONS } from "@/lib/config";
import { CHOICE_OPTIONS, MAX_OPTION_LENGTH, THEME_KINDS, type ThemeKind } from "@/lib/idea-value";
import { cn } from "@/lib/utils";

type Theme = {
  id: string;
  title: string;
  description: string | null;
  kind: ThemeKind;
  options: string[];
  allowOtherIdeas: boolean;
  singleChoice: boolean;
  maxVotes: number | null;
  pointsBudget: number | null;
  ideaCount: number;
  inPastRounds: boolean;
};

type ThemeValues = {
  title: string;
  description: string;
  kind: ThemeKind;
  options: string[];
  allowOtherIdeas: boolean;
  singleChoice: boolean;
  maxVotes: number | null;
  pointsBudget: number | null;
};

/** Common topics offered in one tap (keys of the themes.suggestions namespace), with their answer kind. */
const SUGGESTIONS = {
  goal: "TEXT",
  dates: "DATE_RANGE",
  place: "PLACE",
  budget: "AMOUNT_RANGE",
  priorities: "TEXT",
  roles: "TEXT",
} as const satisfies Record<string, ThemeKind>;
type SuggestionKey = keyof typeof SUGGESTIONS;

export function ThemeEditor({
  slug,
  themes,
  allowSelfVote,
  ideasTimerMinutes,
  autoRecap,
  capacity,
  participantCount,
}: {
  slug: string;
  themes: Theme[];
  allowSelfVote: boolean;
  ideasTimerMinutes: number | null;
  autoRecap: boolean;
  capacity: number;
  participantCount: number;
}) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();
  const [view] = useView();
  // Back from the ideas phase: we resume rather than start.
  const startLabel = themes.some((th) => th.ideaCount > 0) ? t("resume") : t("start");

  const existing = new Set(themes.map((th) => th.title.toLowerCase()));
  const suggestions = (Object.keys(SUGGESTIONS) as SuggestionKey[])
    .map((key) => ({ id: key, label: t(`suggestions.${key}.title`) }))
    .filter(
    (s) => !existing.has(s.label.toLowerCase()),
  );

  const rows = themes.map((theme, i) => (
    <ThemeRow key={theme.id} slug={slug} theme={theme} isFirst={i === 0} isLast={i === themes.length - 1} board={view === "board"} />
  ));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        {themes.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          view === "board" ? <BoardColumns as="ul">{rows}</BoardColumns> : <ul className="space-y-2">{rows}</ul>
        )}

        <SuggestionChips
          label={t("suggestionsLabel")}
          items={suggestions}
          disabled={pending}
          onSelect={(key) => {
            const k = key as SuggestionKey;
            run(() =>
              addTheme(slug, {
                title: t(`suggestions.${k}.title`),
                description: t(`suggestions.${k}.description`),
                kind: SUGGESTIONS[k],
              }),
            );
          }}
        />

        <ThemeForm submitLabel={t("add")} pending={pending} onSubmit={(values, reset) => run(() => addTheme(slug, values), reset)} />
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg font-bold">{t("settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SettingSwitch
              id="self-vote"
              label={t("allowSelfVote")}
              hint={t("allowSelfVoteHint")}
              checked={allowSelfVote}
              disabled={pending}
              onCheckedChange={(checked) => run(() => setAllowSelfVote(slug, checked))}
            />
            <SegmentedControl
              name="ideas-timer"
              label={t("timerLabel")}
              hint={t("timerHint")}
              options={[
                { value: "off", label: t("timerOff") },
                ...IDEAS_TIMER_OPTIONS.map((m) => ({ value: String(m), label: t("timerMinutes", { count: m }) })),
              ]}
              value={ideasTimerMinutes ? String(ideasTimerMinutes) : "off"}
              disabled={pending}
              onChange={(value) => run(() => setIdeasTimer(slug, value === "off" ? null : Number(value)))}
            />
            {ideasTimerMinutes !== null && (
              <SettingSwitch
                id="auto-recap"
                label={t("autoRecap")}
                hint={t("autoRecapHint")}
                checked={autoRecap}
                disabled={pending}
                onCheckedChange={(checked) => run(() => setAutoRecap(slug, checked))}
              />
            )}
            <SegmentedControl
              name="room-size"
              label={t("sizeLabel")}
              hint={t("sizeHint", { count: participantCount })}
              // Sizes below the people already seated are not offered.
              options={ROOM_SIZES.filter((n) => n >= participantCount).map((n) => ({
                value: String(n),
                label: t("sizeOption", { count: n }),
              }))}
              value={String(capacity)}
              disabled={pending}
              onChange={(value) => run(() => setRoomSize(slug, Number(value)))}
            />
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          disabled={pending || themes.length === 0}
          onClick={() => run(() => startIdeasPhase(slug))}
        >
          <Play data-icon="inline-start" />
          {startLabel}
        </Button>
        {themes.length === 0 && <p className="text-center text-sm text-muted-foreground">{t("startHint")}</p>}
      </aside>
    </div>
  );
}

function ThemeRow({
  slug,
  theme,
  isFirst,
  isLast,
  board,
}: {
  slug: string;
  theme: Theme;
  isFirst: boolean;
  isLast: boolean;
  /** A card on the board rather than a row of the list: same actions. */
  board: boolean;
}) {
  const t = useTranslations("themes");
  const [editing, setEditing] = useState(false);
  const [pending, run] = useAction();

  if (editing) {
    return (
      // On the board, the form takes the whole row: a column is too narrow for it.
      <li className={cn(board && "md:col-span-full")}>
        <ThemeForm
          initial={theme}
          submitLabel={t("save")}
          pending={pending}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => run(() => updateTheme(slug, theme.id, values), () => setEditing(false))}
        />
      </li>
    );
  }

  const remove = () => run(() => deleteTheme(slug, theme.id));
  const actions = (
    <>
      {/* Focusable even while disabled: moving a topic to the top or the bottom (or waiting for the
          server) must not drop keyboard focus to the page. */}
      <Button variant="ghost" size="icon" aria-label={t("moveUp")} title={t("moveUp")} focusableWhenDisabled disabled={pending || isFirst} onClick={() => run(() => moveTheme(slug, theme.id, "up"))}>
        <ArrowUp />
      </Button>
      <Button variant="ghost" size="icon" aria-label={t("moveDown")} title={t("moveDown")} focusableWhenDisabled disabled={pending || isLast} onClick={() => run(() => moveTheme(slug, theme.id, "down"))}>
        <ArrowDown />
      </Button>
      <Button variant="ghost" size="icon" aria-label={t("edit")} disabled={pending} onClick={() => setEditing(true)}>
        <Pencil />
      </Button>
      {theme.inPastRounds ? null : theme.ideaCount > 0 ? (
        <ConfirmButton
          variant="ghost"
          size="icon"
          aria-label={t("delete")}
          disabled={pending}
          title={t("deleteConfirm", { title: theme.title })}
          description={t("deleteConfirmHint", { count: theme.ideaCount })}
          confirmLabel={t("delete")}
          onConfirm={remove}
        >
          <Trash2 />
        </ConfirmButton>
      ) : (
        <Button variant="ghost" size="icon" aria-label={t("delete")} disabled={pending} onClick={remove}>
          <Trash2 />
        </Button>
      )}
    </>
  );

  if (board) {
    return (
      <TopicCard
        title={theme.title}
        description={theme.description}
        badges={[
          ...(theme.kind === "TEXT" ? [] : [{ label: t(`kinds.${theme.kind}`), icon: THEME_KIND_ICONS[theme.kind] }]),
          ...(theme.maxVotes === null ? [] : [{ label: t("voteLimitBadge", { count: theme.maxVotes }), icon: Vote }]),
          ...(theme.pointsBudget === null ? [] : [{ label: t("pointsBadge", { count: theme.pointsBudget }), icon: Coins }]),
        ]}
        actions={actions}
      />
    );
  }

  return (
    <ListItem
      tone="plain"
      meta={
        (theme.description || theme.kind !== "TEXT" || theme.maxVotes !== null || theme.pointsBudget !== null) && (
          <>
            {theme.kind !== "TEXT" && <IconBadge icon={THEME_KIND_ICONS[theme.kind]} label={t(`kinds.${theme.kind}`)} />}
            {theme.maxVotes !== null && <IconBadge icon={Vote} label={t("voteLimitBadge", { count: theme.maxVotes })} />}
            {theme.pointsBudget !== null && <IconBadge icon={Coins} label={t("pointsBadge", { count: theme.pointsBudget })} />}
            {theme.description && <span className="text-sm text-muted-foreground">{theme.description}</span>}
          </>
        )
      }
      actions={actions}
    >
      {theme.title}
    </ListItem>
  );
}

function ThemeForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Theme;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ThemeValues, reset: () => void) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("themes");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<ThemeKind>(initial?.kind ?? "TEXT");
  const [options, setOptions] = useState<string[]>(initial?.options ?? []);
  const [allowOtherIdeas, setAllowOtherIdeas] = useState(initial?.allowOtherIdeas ?? false);
  const [singleChoice, setSingleChoice] = useState(initial?.singleChoice ?? false);
  const [maxVotes, setMaxVotes] = useState<number | null>(initial?.maxVotes ?? null);
  const [pointsBudget, setPointsBudget] = useState<number | null>(initial?.pointsBudget ?? null);
  // One answer per person is already a limit of one: no vote limit to choose, and no points.
  const single = kind === "CHOICE" && singleChoice;
  // Points: the budget is the limit, and several points can go on one option.
  const points = !single && pointsBudget !== null;
  const optionsMissing = kind === "CHOICE" && options.length < CHOICE_OPTIONS.min;
  const idPrefix = initial?.id ?? "new";
  // Ideas already exist: changing their kind would make them unreadable.
  const kindLocked = (initial?.ideaCount ?? 0) > 0;

  return (
    <Card size="sm" className={initial ? undefined : "border-dashed"}>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(
              {
                title,
                description,
                kind,
                options,
                allowOtherIdeas,
                singleChoice: points ? false : singleChoice,
                maxVotes: single || points ? null : maxVotes,
                pointsBudget: points ? pointsBudget : null,
              },
              () => {
              setTitle("");
              setDescription("");
              setKind("TEXT");
              setOptions([]);
              setAllowOtherIdeas(false);
              setSingleChoice(false);
              setMaxVotes(null);
              setPointsBudget(null);
              },
            );
          }}
        >
          <FormField id={`${idPrefix}-title`} label={t("titleLabel")}>
            <Input
              id={`${idPrefix}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={LIMITS.themeTitle}
              required
              autoFocus={!!initial}
            />
          </FormField>
          <FormField id={`${idPrefix}-description`} label={t("descriptionLabel")}>
            <Textarea
              id={`${idPrefix}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={LIMITS.themeDescription}
              rows={2}
            />
          </FormField>
          <SegmentedControl
            name={`${idPrefix}-kind`}
            label={t("kindLabel")}
            options={THEME_KINDS.map((k) => ({ value: k, label: t(`kinds.${k}`), icon: THEME_KIND_ICONS[k] }))}
            value={kind}
            onChange={setKind}
            disabled={kindLocked}
            hint={kindLocked ? t("kindLocked") : t(`kindHints.${kind}`)}
          />
          {kind === "CHOICE" && (
            <div className="space-y-4 rounded-xl bg-muted/50 p-3 motion-safe:animate-in motion-safe:fade-in">
              <OptionListField
                idPrefix={idPrefix}
                value={options}
                onChange={setOptions}
                max={CHOICE_OPTIONS.max}
                maxLength={MAX_OPTION_LENGTH}
                labels={{
                  label: t("optionsLabel"),
                  hint: t("optionsHint", { min: CHOICE_OPTIONS.min, max: CHOICE_OPTIONS.max }),
                  placeholder: t("optionPlaceholder"),
                  add: t("optionAdd"),
                  remove: (option) => t("optionRemove", { option }),
                }}
              />
              <SettingSwitch
                id={`${idPrefix}-other-ideas`}
                label={t("allowOtherIdeas")}
                hint={t("allowOtherIdeasHint")}
                checked={allowOtherIdeas}
                onCheckedChange={setAllowOtherIdeas}
              />
              {!points && (
                <SettingSwitch
                  id={`${idPrefix}-single-choice`}
                  label={t("singleChoice")}
                  // Votes may already exist: switching would break the rule for them.
                  hint={kindLocked ? t("singleChoiceLocked") : t("singleChoiceHint")}
                  checked={singleChoice}
                  disabled={kindLocked}
                  onCheckedChange={setSingleChoice}
                />
              )}
            </div>
          )}
          {!single && (
            <SegmentedControl
              name={`${idPrefix}-voting`}
              label={t("votingLabel")}
              options={[
                { value: "votes", label: t("votingVotes") },
                { value: "points", label: t("votingPoints") },
              ]}
              value={points ? "points" : "votes"}
              onChange={(value) => setPointsBudget(value === "points" ? DEFAULT_POINTS_BUDGET : null)}
              // Votes may already exist: switching would break the rule for them.
              disabled={kindLocked}
              hint={kindLocked ? t("votingLocked") : points ? t("votingPointsHint") : t("votingVotesHint")}
            />
          )}
          {points && (
            <SegmentedControl
              name={`${idPrefix}-points-budget`}
              label={t("pointsBudgetLabel")}
              options={POINTS_BUDGET_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(pointsBudget)}
              onChange={(value) => setPointsBudget(Number(value))}
              disabled={kindLocked}
            />
          )}
          {!single && !points && (
            <SegmentedControl
              name={`${idPrefix}-max-votes`}
              label={t("voteLimitLabel")}
              hint={t("voteLimitHint")}
              options={[
                { value: "none", label: t("voteLimitNone") },
                ...VOTE_LIMIT_OPTIONS.map((n) => ({ value: String(n), label: String(n) })),
              ]}
              value={maxVotes === null ? "none" : String(maxVotes)}
              onChange={(value) => setMaxVotes(value === "none" ? null : Number(value))}
            />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                {t("cancel")}
              </Button>
            )}
            <Button type="submit" disabled={pending || !title.trim() || optionsMissing}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
