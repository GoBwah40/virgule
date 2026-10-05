import { getRoomContext } from "@/lib/room";

/**
 * Current session step, polled by the client-side sync (RoomLive): if it has changed,
 * the client navigates straight to the right page instead of refreshing the old one
 * (which would redirect with an empty intermediate render).
 */
export async function GET(_request: Request, { params }: RouteContext<"/r/[slug]/phase">) {
  const ctx = await getRoomContext((await params).slug);
  // Participants, and the room screen paired by the host.
  if (ctx.status !== "ok" || (!ctx.me && !ctx.isScreen)) return new Response(null, { status: 404 });
  return Response.json({ phase: ctx.room.phase }, { headers: { "Cache-Control": "no-store" } });
}
