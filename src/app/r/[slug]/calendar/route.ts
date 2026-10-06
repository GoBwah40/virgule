import { calendarResponse } from "@/lib/calendar-file";
import { getRecap, getRoomContext } from "@/lib/room";

/** The decided date or period of a topic, as a calendar file: same access as the exports. */
export async function GET(request: Request, { params }: RouteContext<"/r/[slug]/calendar">) {
  const ctx = await getRoomContext((await params).slug);
  if (ctx.status !== "ok") return new Response("Not found", { status: 404 });
  if (!ctx.me) return new Response("Forbidden", { status: 403 });
  if (ctx.room.phase !== "RECAP" && ctx.room.phase !== "CLOSED") {
    return new Response("Available from the recap phase", { status: 409 });
  }
  return calendarResponse(request, ctx.room.name, await getRecap(ctx.room, null));
}
