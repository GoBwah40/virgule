import { calendarResponse } from "@/lib/calendar-file";
import { getSharedRecap } from "@/lib/room";

/** Same calendar file, from the shared recap, for people who were not there. */
export async function GET(request: Request, { params }: RouteContext<"/recap/[token]/calendar">) {
  const shared = await getSharedRecap((await params).token);
  if (shared.status !== "ok" || !shared.rounds) return new Response("Not found", { status: 404 });
  return calendarResponse(request, shared.room.name, shared.rounds);
}
