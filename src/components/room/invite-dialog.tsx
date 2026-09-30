"use client";

import { QrCode as QrCodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/copy-button";
import { QrCode } from "@/components/qr-code";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = { invitePath: string; roomName: string; freeSeats: number };

/** Invitation pour un groupe réuni au même endroit : QR code à scanner, partage natif, copie du lien. */
export function InviteDialog({ invitePath, roomName, freeSeats }: Props) {
  const t = useTranslations("room");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label={t("invite")} title={t("invite")} />}>
        <QrCodeIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">{t("inviteTitle")}</DialogTitle>
          <DialogDescription>
            {freeSeats > 0 ? t("inviteDescription", { count: freeSeats }) : t("inviteFull")}
          </DialogDescription>
        </DialogHeader>
        <InviteCode invitePath={invitePath} label={t("qrLabel")} />
        <DialogFooter className="gap-2 sm:justify-center">
          <ShareButton path={invitePath} title={roomName} text={t("shareText", { name: roomName })} label={t("share")} />
          <CopyButton value={invitePath} absolute label={t("copyLink")} successMessage={t("linkCopied")} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Monté seulement à l'ouverture du dialogue, donc toujours côté navigateur : l'origine est connue.
function InviteCode({ invitePath, label }: { invitePath: string; label: string }) {
  return <QrCode value={`${window.location.origin}${invitePath}`} label={label} className="mx-auto w-full max-w-60" />;
}
