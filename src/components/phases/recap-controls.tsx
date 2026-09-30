"use client";

import { Download, Equal, FileSpreadsheet, FileText, Flag, Printer, RotateCcw, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmButton } from "@/components/confirm-button";
import { SettingSwitch } from "@/components/setting-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAction } from "@/hooks/use-action";
import { closeSession, reopenVoting, setRequireNetPositive, startNextRound, startTiebreakRound } from "@/lib/actions";

export function RecapHostControls({
  slug,
  requireNetPositive,
  nextRound,
  qualifiedCount,
  tiedThemeCount,
}: {
  slug: string;
  requireNetPositive: boolean;
  nextRound: number;
  qualifiedCount: number;
  tiedThemeCount: number;
}) {
  const t = useTranslations("recap");
  const [pending, run] = useAction();

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-bold">{t("hostControls")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingSwitch
          id="net-positive"
          label={t("requireNetPositive")}
          hint={t("requireNetPositiveHint")}
          checked={requireNetPositive}
          disabled={pending}
          onCheckedChange={(checked) => run(() => setRequireNetPositive(slug, checked))}
        />

        <Separator />

        <div className="space-y-2">
          <ConfirmButton
            className="w-full"
            disabled={pending}
            title={t("nextRoundConfirm", { round: nextRound })}
            description={t("nextRoundConfirmHint")}
            onConfirm={() => run(() => startNextRound(slug))}
          >
            <RotateCcw data-icon="inline-start" />
            {t("nextRound")}
          </ConfirmButton>
          <p className="text-sm text-muted-foreground">{t("nextRoundHint", { count: qualifiedCount })}</p>
        </div>
        {tiedThemeCount > 0 && (
          <div className="space-y-2">
            <ConfirmButton
              variant="outline"
              className="w-full"
              disabled={pending}
              title={t("tiebreakConfirm")}
              description={t("tiebreakConfirmHint")}
              confirmLabel={t("tiebreak")}
              onConfirm={() => run(() => startTiebreakRound(slug))}
            >
              <Equal data-icon="inline-start" />
              {t("tiebreak")}
            </ConfirmButton>
            <p className="text-sm text-muted-foreground">
              {t("tiesNotice", { count: tiedThemeCount })} {t("tiebreakHint")}
            </p>
          </div>
        )}
        <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(() => reopenVoting(slug))}>
          <Undo2 data-icon="inline-start" />
          {t("reopen")}
        </Button>
        <ConfirmButton
          variant="destructive"
          className="w-full"
          disabled={pending}
          title={t("closeConfirm")}
          description={t("closeConfirmHint")}
          confirmLabel={t("close")}
          onConfirm={() => run(() => closeSession(slug))}
        >
          <Flag data-icon="inline-start" />
          {t("close")}
        </ConfirmButton>
      </CardContent>
    </Card>
  );
}

export function ExportMenu({ slug }: { slug: string }) {
  const t = useTranslations("export");
  const href = (format: "md" | "csv") => `/r/${slug}/export?format=${format}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="print:hidden" />}>
        <Download data-icon="inline-start" />
        {t("button")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem render={<a href={href("md")} download />}>
          <FileText />
          <ExportLabel title={t("markdown")} hint={t("markdownHint")} />
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href={href("csv")} download />}>
          <FileSpreadsheet />
          <ExportLabel title={t("csv")} hint={t("csvHint")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer />
          <ExportLabel title={t("print")} hint={t("printHint")} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="flex flex-col">
      <span>{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </span>
  );
}
