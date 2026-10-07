import { getRoomContext } from "@/lib/room";

/**
 * Current session step, polled by the client-side sync (RoomLive): if it has changed,
 * the client navigates straight to the right page instead of refreshing the old one
 * (which would redirect with an empty intermediate render). It also gives the server's clock,
 * which the countdowns follow rather than the device's own.
 */
export async function GET(_request: Request, { params }: RouteContext<"/r/[slug]/phase">) {
  const ctx = await getRoomContext((await params).slug);
  // Participants, and the room screen paired by the host.
  if (ctx.status !== "ok" || (!ctx.me && !ctx.isScreen)) return new Response(null, { status: 404 });
  // The server's clock, read last: the client takes it as halfway through the request.
  return Response.json({ phase: ctx.room.phase, now: Date.now() }, { headers: { "Cache-Control": "no-store" } });
}
