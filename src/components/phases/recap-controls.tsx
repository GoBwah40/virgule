"use client";

import { Download, FileSpreadsheet, FileText, Flag, Printer, RotateCcw, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/hooks/use-action";
import { closeSession, reopenVoting, setRequireNetPositive, startNextRound } from "@/lib/actions";

export function RecapHostControls({
  slug,
  requireNetPositive,
  nextRound,
  qualifiedCount,
}: {
  slug: string;
  requireNetPositive: boolean;
  nextRound: number;
  qualifiedCount: number;
}) {
  const t = useTranslations("recap");
  const [pending, run] = useAction();

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>{t("hostControls")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="net-positive">{t("requireNetPositive")}</Label>
            <p className="text-xs text-muted-foreground">{t("requireNetPositiveHint")}</p>
          </div>
          <Switch
            id="net-positive"
            checked={requireNetPositive}
            disabled={pending}
            onCheckedChange={(checked) => run(() => setRequireNetPositive(slug, checked))}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <ConfirmButton
            className="w-full"
            disabled={pending}
            title={t("nextRoundConfirm", { round: nextRound })}
            description={t("nextRoundHint", { count: qualifiedCount })}
            onConfirm={() => run(() => startNextRound(slug))}
          >
            <RotateCcw data-icon="inline-start" />
            {t("nextRound")}
          </ConfirmButton>
          <p className="text-xs text-muted-foreground">{t("nextRoundHint", { count: qualifiedCount })}</p>
        </div>
        <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(() => reopenVoting(slug))}>
          <Undo2 data-icon="inline-start" />
          {t("reopen")}
        </Button>
        <ConfirmButton
          variant="destructive"
          className="w-full"
          disabled={pending}
          title={t("closeConfirm")}
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
