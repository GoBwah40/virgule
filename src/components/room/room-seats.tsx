"use client";

import { toast } from "sonner";

import { type Seat, SeatRow } from "@/components/seat-row";
import { MAX_PARTICIPANTS } from "@/lib/config";

type Props = {
  seats: Seat[];
  invitePath: string;
  labels: React.ComponentProps<typeof SeatRow>["labels"];
  successMessage: string;
};

/** Rangée de sièges de la room : toucher une place libre copie le lien d'invitation. */
export function RoomSeats({ seats, invitePath, labels, successMessage }: Props) {
  return (
    <SeatRow
      seats={seats}
      capacity={MAX_PARTICIPANTS}
      labels={labels}
      onFreeSeatClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
        toast.success(successMessage);
      }}
    />
  );
}
