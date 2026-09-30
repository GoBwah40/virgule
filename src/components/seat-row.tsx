"use client";

import { Crown, type LucideIcon, Plus } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Seat = { id: string; name: string; isMe?: boolean; isHost?: boolean };

type SeatAction = { id: string; label: string; icon: LucideIcon; destructive?: boolean };

/** Menu for a taken seat, opened by right click, click or keyboard. */
type SeatMenu = {
  /** Accessible name of the seat button (e.g. "Leo's seat: options"). */
  label: (seat: Seat) => string;
  /** Actions offered for this seat; none = no menu. */
  actions: (seat: Seat) => SeatAction[];
  onSelect: (seat: Seat, actionId: string) => void;
};

type Props = {
  seats: Seat[];
  /** Total number of seats (an airplane row: 6 seats, aisle between C and D). */
  capacity: number;
  labels: { free: string; you: string; host: string; row: string };
  /** Action on a free seat, e.g. copying the invite link. */
  onFreeSeatClick?: () => void;
  menu?: SeatMenu;
  size?: "sm" | "md";
  className?: string;
};

const LETTERS = "ABCDEFGHIJ";

/** Participants shown as a row of seats: who is on board, how many seats are left. */
export function SeatRow({ seats, capacity, labels, onFreeSeatClick, menu, size = "sm", className }: Props) {
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
              "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-75 motion-safe:duration-300",
              box,
              seat.isMe ? "bg-highlight text-[#2a1a24]" : "bg-highlight-soft text-highlight-foreground",
            )}
          >
            {seat.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span
            className={cn(
              "grid place-items-center rounded-t-[10px] rounded-b-md border-[1.5px] border-dashed border-muted-foreground/70 text-muted-foreground",
              box,
            )}
          >
            <Plus className="size-4" aria-hidden />
          </span>
        );

        return (
          <li
            key={seat?.id ?? `free-${letter}`}
            className={cn("relative grid justify-items-center gap-0.5", i === aisle && "ml-2.5")}
          >
            {seat?.isHost && (
              // Crown sitting on the seat: no row reserved above each seat.
              <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-card px-0.5 text-primary" aria-hidden>
                <Crown className="size-3" />
              </span>
            )}
            {seat && menu && menu.actions(seat).length > 0 ? (
              <SeatMenuTrigger seat={seat} menu={menu} label={label}>
                {body}
              </SeatMenuTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    !seat && onFreeSeatClick ? (
                      <button type="button" onClick={onFreeSeatClick} aria-label={label} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/80" />
                    ) : (
                      <span tabIndex={0} aria-label={label} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/80" />
                    )
                  }
                >
                  {body}
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            )}
            <span className="font-mono text-[10px] leading-none text-muted-foreground" aria-hidden>
              {letter}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SeatMenuTrigger({ seat, menu, label, children }: { seat: Seat; menu: SeatMenu; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={menu.label(seat)}
            title={label}
            className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
            // Right click (and long press on Android): same menu as a click.
            onContextMenu={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          />
        }
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {menu.actions(seat).map(({ id, label: actionLabel, icon: Icon, destructive }) => (
            <DropdownMenuItem
              key={id}
              variant={destructive ? "destructive" : "default"}
              className="min-h-11"
              onClick={() => menu.onSelect(seat, id)}
            >
              <Icon />
              {actionLabel}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
