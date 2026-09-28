import { redirect } from "next/navigation";

import { getRoomContext, phasePath } from "@/lib/room";

/** Lien de partage : envoie chacun vers la phase en cours. */
export default async function RoomIndex({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const ctx = await getRoomContext(slug);
  // Le layout gère déjà les cas « introuvable », « expirée » et « pas encore rejoint ».
  if (ctx.status !== "ok" || !ctx.me) return null;
  redirect(phasePath(slug, ctx.room.phase));
}
