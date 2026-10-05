import { getTranslations } from "next-intl/server";

import { CopyButton } from "@/components/copy-button";
import { PhaseStepper } from "@/components/phase-stepper";
import { Logo } from "@/components/logo";
import { InviteDialog } from "@/components/room/invite-dialog";
import { LeaveRoomButton } from "@/components/room/leave-room-button";
import { RoomSeats } from "@/components/room/room-seats";
import { Badge } from "@/components/ui/badge";
import type { Phase } from "@/generated/prisma/enums";
import { canRemoveParticipants } from "@/lib/config";

const STEPS: Phase[] = ["THEMES", "IDEAS", "RECAP"];

type Props = {
  room: { slug: string; name: string; phase: Phase; round: number; expiresAt: Date; capacity: number };
  participants: { id: string; pseudo: string; isHost: boolean }[];
  meId: string;
};

export async function RoomHeader({ room, participants, meId }: Props) {
  const isHost = participants.some((p) => p.id === meId && p.isHost);
  const t = await getTranslations("room");
  const tApp = await getTranslations("app");
  const invitePath = `/r/${room.slug}`;

  return (
    // Fixed transition name: the header does not move when the step changes (see globals.css).
    <header className="border-b bg-card" style={{ viewTransitionName: "room-header" }}>
      {/* 2-column grid: name then steps on the left, link then seats on the right.
          The steps follow the name directly, without waiting for the seats' height. */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 px-4 py-4">
        {/* space-y-1: room for the logo's touch area above the name. */}
        <div className="min-w-0 space-y-1">
          <Logo label={tApp("name")} href="/" className="text-lg" />
          <h1 className="truncate text-2xl leading-tight font-extrabold">{room.name}</h1>
          <p className="text-xs text-muted-foreground">{t("expiresOn", { date: room.expiresAt })}</p>
        </div>
        {/* Right column: link then seats, stacked tightly on desktop.
            On mobile, `contents` keeps the button next to the name and the seats on the last row. */}
        <div className="contents sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:flex-col sm:items-end sm:gap-4">
          {/* Invite and leave: screen-only, the printed recap keeps the name and the seats. */}
          <div className="flex shrink-0 gap-2 justify-self-end print:hidden">
            <InviteDialog
              invitePath={invitePath}
              roomName={room.name}
              freeSeats={Math.max(0, room.capacity - participants.length)}
            />
            <CopyButton
              size="icon"
              className="sm:w-auto sm:px-4"
              value={invitePath}
              absolute
              label={t("copyLink")}
              successMessage={t("linkCopied")}
              hideLabelOnMobile
            />
            {!isHost && canRemoveParticipants(room) && <LeaveRoomButton slug={room.slug} />}
          </div>
          <RoomSeats
            slug={room.slug}
            capacity={room.capacity}
            canManage={isHost && room.phase !== "CLOSED"}
            canRemove={canRemoveParticipants(room)}
            className="order-last col-span-2 sm:order-none"
            invitePath={invitePath}
            seats={participants.map((p) => ({ id: p.id, name: p.pseudo, isHost: p.isHost, isMe: p.id === meId }))}
            labels={{
              row: t("seats.row", { count: participants.length, max: room.capacity }),
              free: t("seats.free"),
              you: t("you"),
              host: t("host"),
            }}
            successMessage={t("linkCopied")}
          />
        </div>

        <PhaseStepper
          className="col-span-2 sm:col-span-1"
          label={t("phasesLabel")}
          steps={STEPS.map((id) => ({ id, label: t(`phases.${id}`) }))}
          current={room.phase === "CLOSED" ? STEPS.length : STEPS.indexOf(room.phase)}
          extra={
            <>
              <li>
                <Badge variant="outline">{t("round", { round: room.round })}</Badge>
              </li>
              {room.phase === "CLOSED" && (
                <li>
                  <Badge variant="secondary">{t("phases.CLOSED")}</Badge>
                </li>
              )}
            </>
          }
        />
      </div>
    </header>
  );
}
