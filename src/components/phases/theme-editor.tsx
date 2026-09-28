"use client";

import { ArrowDown, ArrowUp, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { addTheme, deleteTheme, moveTheme, setAllowSelfVote, startIdeasPhase, updateTheme } from "@/lib/actions";
import { LIMITS } from "@/lib/config";

type Theme = { id: string; title: string; description: string | null };

export function ThemeEditor({
  slug,
  themes,
  allowSelfVote,
}: {
  slug: string;
  themes: Theme[];
  allowSelfVote: boolean;
}) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {themes.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
        {themes.map((theme, i) => (
          <ThemeRow key={theme.id} slug={slug} theme={theme} isFirst={i === 0} isLast={i === themes.length - 1} />
        ))}
        <ThemeForm
          submitLabel={t("add")}
          onSubmit={(values, reset) => run(() => addTheme(slug, values), reset)}
          pending={pending}
        />
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="self-vote">{t("allowSelfVote")}</Label>
                <p className="text-xs text-muted-foreground">{t("allowSelfVoteHint")}</p>
              </div>
              <Switch
                id="self-vote"
                checked={allowSelfVote}
                disabled={pending}
                onCheckedChange={(checked) => run(() => setAllowSelfVote(slug, checked))}
              />
            </div>
          </CardContent>
        </Card>

        <ConfirmButton
          size="lg"
          className="w-full"
          disabled={pending || themes.length === 0}
          title={t("start")}
          onConfirm={() => run(() => startIdeasPhase(slug))}
        >
          <Play data-icon="inline-start" />
          {t("start")}
        </ConfirmButton>
        {themes.length === 0 && <p className="text-center text-xs text-muted-foreground">{t("startHint")}</p>}
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
      <ThemeForm
        initial={theme}
        submitLabel={t("save")}
        pending={pending}
        onCancel={() => setEditing(false)}
        onSubmit={(values) => run(() => updateTheme(slug, theme.id, values), () => setEditing(false))}
      />
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{theme.title}</CardTitle>
        {theme.description && <CardDescription>{theme.description}</CardDescription>}
        <CardAction className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={t("moveUp")} disabled={pending || isFirst} onClick={() => run(() => moveTheme(slug, theme.id, "up"))}>
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("moveDown")} disabled={pending || isLast} onClick={() => run(() => moveTheme(slug, theme.id, "down"))}>
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("edit")} disabled={pending} onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("delete")} disabled={pending} onClick={() => run(() => deleteTheme(slug, theme.id))}>
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
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
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-title`}>{t("titleLabel")}</Label>
            <Input
              id={`${idPrefix}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={LIMITS.themeTitle}
              required
              autoFocus={!!initial}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-description`}>{t("descriptionLabel")}</Label>
            <Textarea
              id={`${idPrefix}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={LIMITS.themeDescription}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
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
