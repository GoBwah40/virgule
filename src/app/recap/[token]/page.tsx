import { Hourglass } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { RecapByRound, RecapRoundView } from "@/components/phases/recap-round";
import { ReadOnlyHeader } from "@/components/read-only-header";
import { RoomExpired } from "@/components/room/room-expired";
import { StatusPage } from "@/components/status-page";
import { getSharedRecap } from "@/lib/room";

export async function generateMetadata({ params }: PageProps<"/recap/[token]">): Promise<Metadata> {
  const shared = await getSharedRecap((await params).token);
  return { title: shared.status === "ok" ? shared.room.name : undefined, robots: { index: false } };
}

/**
 * Read-only recap, from the link the host shares with people who were not there: no seat, no
 * cookie, no names, nothing to change. Reloading shows the latest recap.
 */
export default async function SharedRecapPage({ params }: PageProps<"/recap/[token]">) {
  const shared = await getSharedRecap((await params).token);
  if (shared.status === "not_found") notFound();
  if (shared.status === "expired") return <RoomExpired />;

  const [t, tRecap, tApp] = await Promise.all([getTranslations("sharedRecap"), getTranslations("recap"), getTranslations("app")]);
  const { room, rounds } = shared;
  const current = rounds?.[rounds.length - 1];

  return (
    <>
      <ReadOnlyHeader
        logoLabel={tApp("name")}
        title={room.name}
        subtitle={t("byline", { host: shared.hostName, date: room.expiresAt })}
        note={t("note")}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {rounds && current ? (
          <>
            <PageHeader
              title={room.closed ? tRecap("closedTitle") : tRecap("title")}
              subtitle={`${tRecap("summary", { qualified: current.qualifiedCount, total: current.ideaCount })} · ${t("anonymous")}`}
            />
            <RecapByRound rounds={rounds} render={(round) => <RecapRoundView round={round} />} />
          </>
        ) : (
          <StatusPage size="section" icon={Hourglass} title={t("waitingTitle")} body={t("waitingBody", { host: shared.hostName })} />
        )}
      </main>
    </>
  );
}
