"use client";

import { ArrowDown, ArrowUp, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { FormField } from "@/components/form-field";
import { ListItem } from "@/components/list-item";
import { SettingSwitch } from "@/components/setting-switch";
import { SuggestionChips } from "@/components/suggestion-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addTheme, deleteTheme, moveTheme, setAllowSelfVote, startIdeasPhase, updateTheme } from "@/lib/actions";
import { LIMITS } from "@/lib/config";

type Theme = { id: string; title: string; description: string | null; ideaCount: number };

/** Sujets courants proposés en un tap (clés du namespace themes.suggestions). */
const SUGGESTIONS = ["goal", "dates", "place", "budget", "priorities", "roles"] as const;

export function ThemeEditor({ slug, themes, allowSelfVote }: { slug: string; themes: Theme[]; allowSelfVote: boolean }) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();
  // Retour depuis la phase d'idées : on reprend plutôt qu'on ne lance.
  const startLabel = themes.some((th) => th.ideaCount > 0) ? t("resume") : t("start");

  const existing = new Set(themes.map((th) => th.title.toLowerCase()));
  const suggestions = SUGGESTIONS.map((key) => ({ id: key, label: t(`suggestions.${key}.title`) })).filter(
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
            const k = key as (typeof SUGGESTIONS)[number];
            run(() =>
              addTheme(slug, { title: t(`suggestions.${k}.title`), description: t(`suggestions.${k}.description`) }),
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
          <CardContent>
            <SettingSwitch
              id="self-vote"
              label={t("allowSelfVote")}
              hint={t("allowSelfVoteHint")}
              checked={allowSelfVote}
              disabled={pending}
              onCheckedChange={(checked) => run(() => setAllowSelfVote(slug, checked))}
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
      meta={theme.description && <span className="text-sm text-muted-foreground">{theme.description}</span>}
      actions={
        <>
          <Button variant="ghost" size="icon-sm" aria-label={t("moveUp")} disabled={pending || isFirst} onClick={() => run(() => moveTheme(slug, theme.id, "up"))}>
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("moveDown")} disabled={pending || isLast} onClick={() => run(() => moveTheme(slug, theme.id, "down"))}>
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("edit")} disabled={pending} onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
          {theme.ideaCount > 0 ? (
            <ConfirmButton
              variant="ghost"
              size="icon-sm"
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
            <Button variant="ghost" size="icon-sm" aria-label={t("delete")} disabled={pending} onClick={remove}>
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
  onSubmit: (values: { title: string; description: string }, reset: () => void) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("themes");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const idPrefix = initial?.id ?? "new";

  return (
    <Card size="sm" className={initial ? undefined : "border-dashed"}>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ title, description }, () => {
              setTitle("");
              setDescription("");
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                {t("cancel")}
              </Button>
            )}
            <Button type="submit" disabled={pending || !title.trim()}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
