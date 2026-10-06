"use client";

import { Copy, Download, Equal, Eye, FileSpreadsheet, FileText, Flag, Printer, RotateCcw, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { ShareButton } from "@/components/share-button";
import { SettingSwitch } from "@/components/setting-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAction } from "@/hooks/use-action";
import {
  closeSession,
  disableShareLink,
  enableShareLink,
  reopenVoting,
  reuseTopics,
  setRequireNetPositive,
  startNextRound,
  startTiebreakRound,
} from "@/lib/actions";

export function RecapHostControls({
  slug,
  requireNetPositive,
  nextRound,
  qualifiedCount,
  tiedThemeCount,
  hasPointsTopics = false,
}: {
  slug: string;
  requireNetPositive: boolean;
  /** Some topics use points: the rule does not change anything for them, which the hint says. */
  hasPointsTopics?: boolean;
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
          hint={hasPointsTopics ? `${t("requireNetPositiveHint")} ${t("requireNetPositivePointsHint")}` : t("requireNetPositiveHint")}
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
        <ConfirmButton
          variant="outline"
          className="w-full"
          disabled={pending}
          title={t("reopenConfirm")}
          description={t("reopenConfirmHint")}
          confirmLabel={t("reopen")}
          onConfirm={() => run(() => reopenVoting(slug))}
        >
          <Undo2 data-icon="inline-start" />
          {t("reopen")}
        </ConfirmButton>
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

/**
 * Host: a read-only link to the recap, for people who were not there. They take no seat and see
 * no names; the link stops working when the session goes offline, or when the host turns it off.
 */
/** Session over: a new one with the same topics and settings, hosted by whoever taps it. */
export function ReuseTopicsButton({ slug }: { slug: string }) {
  const t = useTranslations("recap");
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      variant="outline"
      className="print:hidden"
      disabled={pending}
      title={t("reuseConfirm")}
      description={t("reuseConfirmHint")}
      confirmLabel={t("reuse")}
      onConfirm={() => run(() => reuseTopics(slug))}
    >
      <Copy data-icon="inline-start" />
      {t("reuse")}
    </ConfirmButton>
  );
}

const noop = () => () => {};

export function ShareRecapButton({ slug, sharePath, roomName }: { slug: string; sharePath: string | null; roomName: string }) {
  const t = useTranslations("recap.share");
  const tCommon = useTranslations("common");
  const tRoom = useTranslations("room");
  const [pending, run] = useAction();
  // The full address, as people will receive it (unknown on the server).
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="print:hidden" />}>
        <Eye data-icon="inline-start" />
        {t("button")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {sharePath ? (
          <>
            <p className="text-sm font-semibold break-all">{`${origin}${sharePath}`}</p>
            <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
              <ShareButton path={sharePath} title={roomName} text={t("shareText", { name: roomName })} label={t("shareVia")} />
              <CopyButton value={sharePath} absolute label={t("copy")} successMessage={t("copied")} errorMessage={tRoom("linkCopyFailed")} />
              <ConfirmButton
                variant="ghost"
                className="text-destructive"
                disabled={pending}
                title={t("disableConfirm")}
                description={t("disableConfirmHint")}
                confirmLabel={t("disable")}
                destructive
                onConfirm={() => run(() => disableShareLink(slug))}
              >
                {t("disable")}
              </ConfirmButton>
            </DialogFooter>
          </>
        ) : (
          <Button disabled={pending} onClick={() => run(() => enableShareLink(slug))}>
            {t("enable")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
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
