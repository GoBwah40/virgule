"use client";

import { Crown, Plus } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Seat = { id: string; name: string; isMe?: boolean; isHost?: boolean };

type Props = {
  seats: Seat[];
  /** Nombre total de places (une rangée d'avion : 6 sièges, allée entre C et D). */
  capacity: number;
  labels: { free: string; you: string; host: string; row: string };
  /** Action sur une place libre, par exemple copier le lien d'invitation. */
  onFreeSeatClick?: () => void;
  size?: "sm" | "md";
  className?: string;
};

const LETTERS = "ABCDEFGHIJ";

/** Participants affichés comme une rangée de sièges : qui est à bord, combien de places restent. */
export function SeatRow({ seats, capacity, labels, onFreeSeatClick, size = "sm", className }: Props) {
  const aisle = Math.ceil(capacity / 2);
  const box = size === "md" ? "h-12 w-11 text-base" : "h-10 w-9 text-sm";

  return (
    <ul aria-label={labels.row} className={cn("flex items-end gap-1.5", className)}>
      {Array.from({ length: capacity }, (_, i) => {
        const seat = seats[i];
        const letter = LETTERS[i];
        const label = seat
          ? [seat.name, seat.isMe && labels.you, seat.isHost && labels.host].filter(Boolean).join(" · ")
          : labels.free;

        const body = seat ? (
          <span
            className={cn(
              "grid place-items-center rounded-t-[10px] rounded-b-md font-bold",
              box,
              seat.isMe ? "bg-highlight text-[#2a1a24]" : "bg-highlight-soft text-highlight-foreground",
            )}
          >
            {seat.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span
            className={cn(
              "grid place-items-center rounded-t-[10px] rounded-b-md border-[1.5px] border-dashed border-border text-muted-foreground",
              box,
            )}
          >
            <Plus className="size-4" aria-hidden />
          </span>
        );

        return (
          <li key={seat?.id ?? `free-${letter}`} className={cn("grid justify-items-center gap-0.5", i === aisle && "ml-2.5")}>
            <span className="h-3 text-primary" aria-hidden>
              {seat?.isHost && <Crown className="size-3" />}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  !seat && onFreeSeatClick ? (
                    <button type="button" onClick={onFreeSeatClick} aria-label={label} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
                  ) : (
                    <span tabIndex={0} aria-label={label} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
                  )
                }
              >
                {body}
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
            <span className="font-mono text-[10px] leading-none text-muted-foreground" aria-hidden>
              {letter}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
