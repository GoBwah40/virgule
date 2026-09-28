import { Crown } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CopyLinkButton } from "@/components/room/copy-link-button";
import { Badge } from "@/components/ui/badge";
import type { Phase } from "@/generated/prisma/enums";
import { MAX_PARTICIPANTS } from "@/lib/config";
import { cn } from "@/lib/utils";

const STEPS: Phase[] = ["THEMES", "IDEAS", "RECAP"];

type Props = {
  room: { slug: string; name: string; phase: Phase; round: number; expiresAt: Date };
  participants: { id: string; pseudo: string; isHost: boolean }[];
  meId: string;
};

export async function RoomHeader({ room, participants, meId }: Props) {
  const t = await getTranslations("room");
  const tApp = await getTranslations("app");
  const currentStep = room.phase === "CLOSED" ? STEPS.length : STEPS.indexOf(room.phase);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-xs font-semibold tracking-wide text-primary uppercase">
              {tApp("name")}
            </Link>
            <h1 className="truncate text-xl font-semibold">{room.name}</h1>
            <p className="text-xs text-muted-foreground">{t("expiresOn", { date: room.expiresAt })}</p>
          </div>
          <CopyLinkButton slug={room.slug} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5",
                    i === currentStep && "bg-primary font-medium text-primary-foreground",
                    i < currentStep && "text-foreground",
                    i > currentStep && "text-muted-foreground",
                  )}
                >
                  {t(`phases.${step}`)}
                </span>
              </li>
            ))}
            <li>
              <Badge variant="outline">{t("round", { round: room.round })}</Badge>
            </li>
            {room.phase === "CLOSED" && (
              <li>
                <Badge variant="secondary">{t("phases.CLOSED")}</Badge>
              </li>
            )}
          </ol>

          <ul className="flex flex-wrap items-center gap-1.5" aria-label={t("participants", { count: participants.length, max: MAX_PARTICIPANTS })}>
            <li className="mr-1 text-xs text-muted-foreground">
              {t("participants", { count: participants.length, max: MAX_PARTICIPANTS })}
            </li>
            {participants.map((p) => (
              <li key={p.id}>
                <Badge variant={p.id === meId ? "default" : "secondary"} title={p.isHost ? t("host") : undefined}>
                  {p.isHost && <Crown data-icon="inline-start" />}
                  {p.pseudo}
                  {p.id === meId && ` (${t("you")})`}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
