import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { JoinForm } from "@/components/room/join-form";
import { RoomExpired } from "@/components/room/room-expired";
import { RoomHeader } from "@/components/room/room-header";
import { RoomLive } from "@/components/room/room-live";
import { SeatRow } from "@/components/seat-row";
import { MAX_PARTICIPANTS } from "@/lib/config";
import { getRoomContext, hostName } from "@/lib/room";

export async function generateMetadata({ params }: LayoutProps<"/r/[slug]">): Promise<Metadata> {
  const ctx = await getRoomContext((await params).slug);
  return { title: ctx.status === "ok" ? ctx.room.name : undefined, robots: { index: false } };
}

export default async function RoomLayout({ children, params }: LayoutProps<"/r/[slug]">) {
  const { slug } = await params;
  const ctx = await getRoomContext(slug);

  if (ctx.status === "not_found") notFound();
  if (ctx.status === "expired") return <RoomExpired />;

  if (!ctx.me) {
    const t = await getTranslations("room");
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <JoinForm
          slug={slug}
          roomName={ctx.room.name}
          hostName={hostName(ctx.participants)}
          seats={ctx.participants.length}
          full={ctx.participants.length >= MAX_PARTICIPANTS}
          closed={ctx.room.phase === "CLOSED"}
          seatRow={
            <SeatRow
              capacity={MAX_PARTICIPANTS}
              seats={ctx.participants.map((p) => ({ id: p.id, name: p.pseudo, isHost: p.isHost }))}
              labels={{
                row: t("seats.row", { count: ctx.participants.length, max: MAX_PARTICIPANTS }),
                free: t("seats.freeStatic"),
                you: t("you"),
                host: t("host"),
              }}
            />
          }
        />
        {/* Met à jour le nombre de places pendant qu'on hésite sur son pseudo. */}
        <RoomLive slug={slug} />
      </main>
    );
  }

  return (
    <>
      <RoomHeader room={ctx.room} participants={ctx.participants} meId={ctx.me.id} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <RoomLive slug={slug} />
    </>
  );
}
