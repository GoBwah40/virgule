import { getRoomContext } from "@/lib/room";

/**
 * Étape en cours de la séance, interrogée par la synchro côté client (RoomLive) :
 * si elle a changé, le client navigue directement vers la bonne page au lieu de
 * rafraîchir l'ancienne (qui redirigerait avec un rendu vide intermédiaire).
 */
export async function GET(_request: Request, { params }: RouteContext<"/r/[slug]/phase">) {
  const ctx = await getRoomContext((await params).slug);
  if (ctx.status !== "ok" || !ctx.me) return new Response(null, { status: 404 });
  return Response.json({ phase: ctx.room.phase }, { headers: { "Cache-Control": "no-store" } });
}
