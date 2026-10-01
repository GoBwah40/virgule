"use client";

import { Crown, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Seat, SeatRow } from "@/components/seat-row";
import { useAction } from "@/hooks/use-action";
import { removeParticipant, transferHost } from "@/lib/actions";
import { MAX_PARTICIPANTS } from "@/lib/config";

type Props = {
  slug: string;
  seats: Seat[];
  invitePath: string;
  labels: React.ComponentProps<typeof SeatRow>["labels"];
  successMessage: string;
  /** The host can hand over hosting (seat menu). */
  canManage: boolean;
  /** The host can also remove someone (only before the recap). */
  canRemove: boolean;
  className?: string;
};

type Pending = { seat: Seat; action: "host" | "remove" } | null;

/**
 * Row of session seats: tapping a free seat copies the invite link; for the host,
 * right-clicking or clicking a taken seat opens its options.
 */
export function RoomSeats({ slug, seats, invitePath, labels, successMessage, canManage, canRemove, className }: Props) {
  const t = useTranslations("room.seats");
  const [, run] = useAction();
  const [pending, setPending] = useState<Pending>(null);

  return (
    <>
      <SeatRow
        seats={seats}
        capacity={MAX_PARTICIPANTS}
        labels={labels}
        className={className}
        onFreeSeatClick={async () => {
          await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
          toast.success(successMessage);
        }}
        menu={
          canManage
            ? {
                label: (seat) => t("manage", { name: seat.name }),
                actions: (seat) =>
                  seat.isMe
                    ? []
                    : [
                        { id: "host", label: t("makeHost"), icon: Crown },
                        ...(canRemove ? [{ id: "remove", label: t("remove"), icon: UserMinus, destructive: true }] : []),
                      ],
                onSelect: (seat, action) => setPending({ seat, action: action as "host" | "remove" }),
              }
            : undefined
        }
      />
      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          title={t(pending.action === "host" ? "makeHostConfirm" : "removeConfirm", { name: pending.seat.name })}
          description={t(pending.action === "host" ? "makeHostConfirmHint" : "removeConfirmHint", { name: pending.seat.name })}
          confirmLabel={t(pending.action === "host" ? "makeHost" : "remove")}
          destructive={pending.action === "remove"}
          onConfirm={() => {
            const { seat, action } = pending;
            run(() => (action === "host" ? transferHost(slug, seat.id) : removeParticipant(slug, seat.id)));
          }}
        />
      )}
    </>
  );
}
