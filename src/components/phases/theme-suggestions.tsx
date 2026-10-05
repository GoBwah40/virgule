"use client";

import { Check, Clock, Undo2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { IconBadge } from "@/components/icon-badge";
import { ListItem } from "@/components/list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";
import { acceptThemeSuggestion, deleteThemeSuggestion, suggestTheme } from "@/lib/actions";
import { LIMITS, MAX_PENDING_SUGGESTIONS } from "@/lib/config";
import type { ThemeSuggestionView } from "@/lib/room";

/** Participants: suggest a topic to the host, and follow their own suggestions. */
export function SuggestThemeCard({
  slug,
  host,
  suggestions,
}: {
  slug: string;
  host: string;
  suggestions: ThemeSuggestionView[];
}) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const full = suggestions.length >= MAX_PENDING_SUGGESTIONS;

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader>
        {/* A first name with no space can be long: it wraps instead of widening the page. */}
        <CardTitle className="font-heading text-lg font-bold wrap-anywhere">{t("suggestTitle", { host })}</CardTitle>
        <CardDescription className="wrap-anywhere">{t("suggestHint", { host })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => suggestTheme(slug, { title, description }),
              () => {
                setTitle("");
                setDescription("");
              },
            );
          }}
        >
          <FormField id="suggest-title" label={t("titleLabel")}>
            <Input
              id="suggest-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={LIMITS.themeTitle}
              required
            />
          </FormField>
          <FormField id="suggest-description" label={t("descriptionLabel")}>
            <Textarea
              id="suggest-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={LIMITS.themeDescription}
              rows={2}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || full || !title.trim()} className="w-full sm:w-auto">
              {t("suggestSubmit")}
            </Button>
          </div>
        </form>

        {suggestions.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-heading text-sm font-bold">{t("mySuggestions")}</h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion) => (
                <ListItem
                  key={suggestion.id}
                  tone="neutral"
                  meta={
                    <>
                      <IconBadge icon={Clock} label={t("suggestionPending")} />
                      {suggestion.description && (
                        <span className="text-sm text-muted-foreground">{suggestion.description}</span>
                      )}
                    </>
                  }
                  actions={
                    <Button
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(() => deleteThemeSuggestion(slug, suggestion.id))}
                    >
                      <Undo2 data-icon="inline-start" />
                      {t("suggestionWithdraw")}
                    </Button>
                  }
                >
                  {suggestion.title}
                </ListItem>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

/** Host: suggestions from the participants, to add to the topics or set aside. */
export function SuggestedThemes({ slug, suggestions }: { slug: string; suggestions: ThemeSuggestionView[] }) {
  const t = useTranslations("themes");

  return (
    <Card size="sm" className="bg-highlight-soft/40 ring-highlight/40 motion-safe:animate-in motion-safe:fade-in">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-bold">{t("suggestionsTitle")}</CardTitle>
        <CardDescription>{t("suggestionsHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {suggestions.map((suggestion) => (
            <SuggestedThemeRow key={suggestion.id} slug={slug} suggestion={suggestion} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SuggestedThemeRow({ slug, suggestion }: { slug: string; suggestion: ThemeSuggestionView }) {
  const t = useTranslations("themes");
  const [pending, run] = useAction();

  return (
    <ListItem
      tone="plain"
      meta={suggestion.description && <span className="text-sm text-muted-foreground">{suggestion.description}</span>}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("suggestionDismiss")}
            title={t("suggestionDismiss")}
            disabled={pending}
            onClick={() => run(() => deleteThemeSuggestion(slug, suggestion.id))}
          >
            <X />
          </Button>
          <Button disabled={pending} onClick={() => run(() => acceptThemeSuggestion(slug, suggestion.id))}>
            <Check data-icon="inline-start" />
            {t("suggestionAccept")}
          </Button>
        </>
      }
    >
      {suggestion.title}
    </ListItem>
  );
}
