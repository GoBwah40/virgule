"use client";

import { Crown, LogOut, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Seat, SeatRow } from "@/components/seat-row";
import { useAction } from "@/hooks/use-action";
import { leaveRoom, removeParticipant, transferHost } from "@/lib/actions";

type Props = {
  slug: string;
  seats: Seat[];
  capacity: number;
  invitePath: string;
  labels: React.ComponentProps<typeof SeatRow>["labels"];
  successMessage: string;
  /** The host can hand over hosting (seat menu); the others can leave from their own seat. */
  canManage: boolean;
  /** Seats can be freed (only before the first recap): the host removes someone, the others leave. */
  canRemove: boolean;
  className?: string;
};

type SeatActionId = "host" | "remove" | "leave";
type Pending = { seat: Seat; action: SeatActionId } | null;

const CONFIRM_KEYS = {
  host: { title: "makeHostConfirm", hint: "makeHostConfirmHint", confirm: "makeHost" },
  remove: { title: "removeConfirm", hint: "removeConfirmHint", confirm: "remove" },
  leave: { title: "leaveConfirm", hint: "leaveConfirmHint", confirm: "leave" },
} as const;

/**
 * Row of session seats: tapping a free seat copies the invite link; for the host,
 * right-clicking or clicking a taken seat opens its options. A guest's own seat offers to leave.
 */
export function RoomSeats({ slug, seats, capacity, invitePath, labels, successMessage, canManage, canRemove, className }: Props) {
  const t = useTranslations("room.seats");
  const [, run] = useAction();
  const [pending, setPending] = useState<Pending>(null);

  return (
    <>
      <SeatRow
        seats={seats}
        capacity={capacity}
        labels={labels}
        className={className}
        onFreeSeatClick={async () => {
          await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
          toast.success(successMessage);
        }}
        menu={{
          label: (seat) => t("manage", { name: seat.name }),
          actions: (seat) => {
            if (!canManage) {
              return seat.isMe && canRemove ? [{ id: "leave", label: t("leave"), icon: LogOut, destructive: true }] : [];
            }
            return seat.isMe
              ? []
              : [
                  { id: "host", label: t("makeHost"), icon: Crown },
                  ...(canRemove ? [{ id: "remove", label: t("remove"), icon: UserMinus, destructive: true }] : []),
                ];
          },
          onSelect: (seat, action) => setPending({ seat, action: action as SeatActionId }),
        }}
      />
      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          title={t(CONFIRM_KEYS[pending.action].title, { name: pending.seat.name })}
          description={t(CONFIRM_KEYS[pending.action].hint, { name: pending.seat.name })}
          confirmLabel={t(CONFIRM_KEYS[pending.action].confirm)}
          destructive={pending.action !== "host"}
          onConfirm={() => {
            const { seat, action } = pending;
            run(() => {
              if (action === "host") return transferHost(slug, seat.id);
              if (action === "remove") return removeParticipant(slug, seat.id);
              return leaveRoom(slug);
            });
          }}
        />
      )}
    </>
  );
}
