"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmButton } from "@/components/confirm-button";
import { useAction } from "@/hooks/use-action";
import { leaveRoom } from "@/lib/actions";

/** For participants who are not hosting: frees their seat and takes them back home. */
export function LeaveRoomButton({ slug }: { slug: string }) {
  const t = useTranslations("room.seats");
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      variant="outline"
      size="icon"
      aria-label={t("leave")}
      title={t("leaveConfirm")}
      description={t("leaveConfirmHint")}
      confirmLabel={t("leave")}
      destructive
      disabled={pending}
      onConfirm={() => run(() => leaveRoom(slug))}
    >
      <LogOut />
    </ConfirmButton>
  );
}
