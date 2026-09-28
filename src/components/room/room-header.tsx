import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CopyButton } from "@/components/copy-button";
import { PhaseStepper } from "@/components/phase-stepper";
import { RoomSeats } from "@/components/room/room-seats";
import { Badge } from "@/components/ui/badge";
import type { Phase } from "@/generated/prisma/enums";
import { MAX_PARTICIPANTS } from "@/lib/config";

const STEPS: Phase[] = ["THEMES", "IDEAS", "RECAP"];

type Props = {
  room: { slug: string; name: string; phase: Phase; round: number; expiresAt: Date };
  participants: { id: string; pseudo: string; isHost: boolean }[];
  meId: string;
};

export async function RoomHeader({ room, participants, meId }: Props) {
  const t = await getTranslations("room");
  const tApp = await getTranslations("app");
  const invitePath = `/r/${room.slug}`;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <Link href="/" className="text-xs font-bold tracking-widest text-primary uppercase">
              {tApp("name")}
            </Link>
            <h1 className="truncate text-2xl leading-tight font-extrabold">{room.name}</h1>
            <p className="text-xs text-muted-foreground">{t("expiresOn", { date: room.expiresAt })}</p>
          </div>
          <CopyButton
            size="icon"
            className="shrink-0 sm:w-auto sm:px-4"
            value={invitePath}
            absolute
            label={t("copyLink")}
            successMessage={t("linkCopied")}
            hideLabelOnMobile
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PhaseStepper
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
          <RoomSeats
            invitePath={invitePath}
            seats={participants.map((p) => ({ id: p.id, name: p.pseudo, isHost: p.isHost, isMe: p.id === meId }))}
            labels={{
              row: t("seats.row", { count: participants.length, max: MAX_PARTICIPANTS }),
              free: t("seats.free"),
              you: t("you"),
              host: t("host"),
            }}
            successMessage={t("linkCopied")}
          />
        </div>
      </div>
    </header>
  );
}
