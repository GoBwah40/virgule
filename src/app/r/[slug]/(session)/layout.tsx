import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { JoinForm } from "@/components/room/join-form";
import { RoomExpired } from "@/components/room/room-expired";
import { RoomHeader } from "@/components/room/room-header";
import { RoomLive } from "@/components/room/room-live";
import { SeatRow } from "@/components/seat-row";
import { pusherClientConfig } from "@/lib/realtime/server";
import { getRoomContext, hostName } from "@/lib/room";

export async function generateMetadata({ params }: LayoutProps<"/r/[slug]">): Promise<Metadata> {
  const ctx = await getRoomContext((await params).slug);
  const title =
    ctx.status === "ok" ? ctx.room.name : ctx.status === "expired" ? (await getTranslations("expired"))("title") : undefined;
  return { title, robots: { index: false } };
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
          capacity={ctx.room.capacity}
          full={ctx.participants.length >= ctx.room.capacity}
          closed={ctx.room.phase === "CLOSED"}
          seatRow={
            <SeatRow
              capacity={ctx.room.capacity}
              seats={ctx.participants.map((p) => ({ id: p.id, name: p.pseudo, isHost: p.isHost }))}
              labels={{
                row: t("seats.row", { count: ctx.participants.length, max: ctx.room.capacity }),
                free: t("seats.freeStatic"),
                you: t("you"),
                host: t("host"),
              }}
            />
          }
        />
        {/* Updates the seat count while the person is choosing a nickname. */}
        <RoomLive slug={slug} pusher={pusherClientConfig()} followPhase={false} serverNow={ctx.serverNow} />
      </main>
    );
  }

  return (
    <>
      <RoomHeader room={ctx.room} participants={ctx.participants} meId={ctx.me.id} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <RoomLive slug={slug} pusher={pusherClientConfig()} serverNow={ctx.serverNow} />
    </>
  );
}
