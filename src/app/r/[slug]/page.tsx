import { redirect } from "next/navigation";

import { phasePath } from "@/lib/phase-path";
import { getRoomContext } from "@/lib/room";

/** Share link: sends everyone to the current phase. */
export default async function RoomIndex({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const ctx = await getRoomContext(slug);
  // The layout already handles the "not found", "expired" and "not joined yet" cases.
  if (ctx.status !== "ok" || !ctx.me) return null;
  redirect(phasePath(slug, ctx.room.phase));
}
