"use client";

import { MonitorCheck, Presentation } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Countdown } from "@/components/countdown";
import { PairingCode } from "@/components/pairing-code";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAction } from "@/hooks/use-action";
import { createScreenCode, unpairScreen } from "@/lib/actions";

type Props = { slug: string; screenPaired: boolean };

/**
 * Host: shows the session on a TV or a projector. The phone gives a one-time code to type on the
 * screen, which then follows the session without taking a seat; the host keeps the controls.
 */
export function PresentDialog({ slug, screenPaired }: Props) {
  const t = useTranslations("present");
  const tCommon = useTranslations("common");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label={t("open")} title={t("open")} />}>
        <Presentation />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        {/* Mounted while no screen is paired: a new code each time, the last one being used up. */}
        {screenPaired ? <PairedScreen slug={slug} /> : <ScreenCode slug={slug} />}
        <DialogFooter className="sm:justify-center">
          {/* The room screen in a tab of its own, for a second display on this device. */}
          <Link href={`/r/${slug}/present`} target="_blank" className={buttonVariants({ variant: "ghost" })}>
            {t("thisDevice")}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScreenCode({ slug }: { slug: string }) {
  const t = useTranslations("present");
  const [pending, run] = useAction();
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  // Only the latest request counts: a code asked for earlier no longer works once a new one is drawn.
  const latest = useRef(0);

  const draw = () => {
    const request = ++latest.current;
    run(async () => {
      const result = await createScreenCode(slug);
      if (result.ok && request === latest.current) setCode({ code: result.code, expiresAt: result.expiresAt });
      return result;
    });
  };
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });
  useEffect(() => drawRef.current(), []);
  // An expired code is replaced by itself while the dialog stays open: nobody has to tap "New code".
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => drawRef.current(), Math.max(0, new Date(code.expiresAt).getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <ol className="space-y-4 text-sm">
      <li className="space-y-1">
        <p>{t("step1")}</p>
        {/* Mounted only once the dialog opens, so always in the browser: the address is known. */}
        <p className="font-semibold break-all">{`${window.location.host}/present`}</p>
      </li>
      <li className="space-y-3">
        <p>{t("step2")}</p>
        {code ? (
          <PairingCode code={code.code} label={t("codeLabel")} className="text-center" />
        ) : (
          <div className="mx-auto h-10 w-48 rounded-lg bg-muted motion-safe:animate-pulse" aria-hidden />
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {code && <Countdown endsAt={code.expiresAt} labels={{ running: t("codeValid"), expired: t("codeExpired") }} />}
          <Button variant="outline" onClick={draw} disabled={pending}>
            {t("newCode")}
          </Button>
        </div>
      </li>
    </ol>
  );
}

function PairedScreen({ slug }: { slug: string }) {
  const t = useTranslations("present");
  const [pending, run] = useAction();
  return (
    <div className="space-y-4 text-center">
      <MonitorCheck className="mx-auto size-10 text-success" aria-hidden />
      <div className="space-y-1">
        <p className="font-heading text-lg font-bold">{t("paired")}</p>
        <p className="text-sm text-muted-foreground">{t("pairedHint")}</p>
      </div>
      <ConfirmButton
        variant="outline"
        className="text-destructive"
        disabled={pending}
        title={t("unpairConfirm")}
        description={t("unpairConfirmHint")}
        confirmLabel={t("unpair")}
        destructive
        onConfirm={() => run(() => unpairScreen(slug))}
      >
        {t("unpair")}
      </ConfirmButton>
    </div>
  );
}
