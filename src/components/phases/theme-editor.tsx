"use client";

import { ArrowDown, ArrowUp, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { OptionListField } from "@/components/option-list-field";
import { THEME_KIND_ICONS } from "@/components/phases/theme-kinds";
import { SegmentedControl } from "@/components/segmented-control";
import { SettingSwitch } from "@/components/setting-switch";
import { SuggestionChips } from "@/components/suggestion-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addTheme, deleteTheme, moveTheme, setAllowSelfVote, setIdeasTimer, startIdeasPhase, updateTheme } from "@/lib/actions";
import { IDEAS_TIMER_OPTIONS, LIMITS } from "@/lib/config";
import { CHOICE_OPTIONS, MAX_OPTION_LENGTH, THEME_KINDS, type ThemeKind } from "@/lib/idea-value";

type Theme = {
  id: string;
  title: string;
  description: string | null;
  kind: ThemeKind;
  options: string[];
  allowOtherIdeas: boolean;
  ideaCount: number;
};

type ThemeValues = {
  title: string;
  description: string;
  kind: ThemeKind;
  options: string[];
  allowOtherIdeas: boolean;
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
}: {
  slug: string;
  themes: Theme[];
  allowSelfVote: boolean;
  ideasTimerMinutes: number | null;
}) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();
  // Back from the ideas phase: we resume rather than start.
  const startLabel = themes.some((th) => th.ideaCount > 0) ? t("resume") : t("start");

  const existing = new Set(themes.map((th) => th.title.toLowerCase()));
  const suggestions = (Object.keys(SUGGESTIONS) as SuggestionKey[])
    .map((key) => ({ id: key, label: t(`suggestions.${key}.title`) }))
    .filter(
    (s) => !existing.has(s.label.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {themes.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {themes.map((theme, i) => (
              <ThemeRow key={theme.id} slug={slug} theme={theme} isFirst={i === 0} isLast={i === themes.length - 1} />
            ))}
          </ul>
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

function ThemeRow({ slug, theme, isFirst, isLast }: { slug: string; theme: Theme; isFirst: boolean; isLast: boolean }) {
  const t = useTranslations("themes");
  const [editing, setEditing] = useState(false);
  const [pending, run] = useAction();

  if (editing) {
    return (
      <li>
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

  return (
    <ListItem
      tone="plain"
      meta={
        (theme.description || theme.kind !== "TEXT") && (
          <>
            {theme.kind !== "TEXT" && <IconBadge icon={THEME_KIND_ICONS[theme.kind]} label={t(`kinds.${theme.kind}`)} />}
            {theme.description && <span className="text-sm text-muted-foreground">{theme.description}</span>}
          </>
        )
      }
      actions={
        <>
          <Button variant="ghost" size="icon" aria-label={t("moveUp")} disabled={pending || isFirst} onClick={() => run(() => moveTheme(slug, theme.id, "up"))}>
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("moveDown")} disabled={pending || isLast} onClick={() => run(() => moveTheme(slug, theme.id, "down"))}>
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("edit")} disabled={pending} onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
          {theme.ideaCount > 0 ? (
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
      }
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
            onSubmit({ title, description, kind, options, allowOtherIdeas }, () => {
              setTitle("");
              setDescription("");
              setKind("TEXT");
              setOptions([]);
              setAllowOtherIdeas(false);
            });
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
            </div>
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
