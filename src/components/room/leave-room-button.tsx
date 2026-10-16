"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-action";
import { leaveRoom } from "@/lib/actions";

/**
 * For participants who are not hosting: frees their seat and takes them back home.
 * With `disabledReason` (seats frozen), the button stays visible but disabled, the reason in a tooltip.
 */
export function LeaveRoomButton({ slug, disabledReason }: { slug: string; disabledReason?: string }) {
  const t = useTranslations("room.seats");
  const [pending, run] = useAction();

  if (disabledReason) {
    // A disabled button doesn't trigger a tooltip: its wrapper explains why instead.
    return (
      <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} aria-label={disabledReason} className="rounded-md" />}>
          <Button variant="outline" size="icon" disabled aria-label={t("leave")}>
            <LogOut />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ConfirmButton
      variant="outline"
      size="icon"
      aria-label={t("leave")}
      title={t("leaveConfirm")}
      description={t("leaveConfirmHint")}
      confirmLabel={t("leave")}
      destructive
      pending={pending}
      onConfirm={() => run(() => leaveRoom(slug))}
    >
      <LogOut />
    </ConfirmButton>
  );
}
