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
    // Nom de transition fixe : l'en-tête ne bouge pas quand on change d'étape (cf. globals.css).
    <header className="border-b bg-card" style={{ viewTransitionName: "room-header" }}>
      {/* Grille 2 colonnes : à gauche nom puis étapes, à droite lien puis sièges.
          Les étapes suivent directement le nom, sans attendre la hauteur des sièges. */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 px-4 py-4">
        <div className="min-w-0 space-y-0.5">
          <Link href="/" className="text-xs font-bold tracking-widest text-primary uppercase">
            {tApp("name")}
          </Link>
          <h1 className="truncate text-2xl leading-tight font-extrabold">{room.name}</h1>
          <p className="text-xs text-muted-foreground">{t("expiresOn", { date: room.expiresAt })}</p>
        </div>
        {/* Colonne de droite : lien puis sièges, serrés l'un sous l'autre sur desktop.
            Sur mobile, `contents` laisse le bouton à côté du nom et les sièges en dernière ligne. */}
        <div className="contents sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:flex-col sm:items-end sm:gap-4">
          <CopyButton
            size="icon"
            className="shrink-0 justify-self-end sm:w-auto sm:px-4"
            value={invitePath}
            absolute
            label={t("copyLink")}
            successMessage={t("linkCopied")}
            hideLabelOnMobile
          />
          <RoomSeats
            className="order-last col-span-2 sm:order-none"
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
