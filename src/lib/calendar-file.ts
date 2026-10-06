import "server-only";

import { getTimeZone, getTranslations } from "next-intl/server";

import { toIcs } from "@/lib/calendar";
import { exportFileName } from "@/lib/export";
import type { RecapRound } from "@/lib/room";

/**
 * Calendar file of a topic's decided date or period, in the latest round: the same for the
 * session's recap and for the shared one. Not found if that topic settled on nothing clear.
 */
export async function calendarResponse(request: Request, roomName: string, rounds: RecapRound[]) {
  const themeId = new URL(request.url).searchParams.get("theme");
  const theme = rounds.at(-1)?.themes.find((t) => t.id === themeId);
  if (!theme?.calendar) return new Response("Not found", { status: 404 });

  const t = await getTranslations("calendar");
  const now = new Date();
  const body = toIcs({
    uid: `${theme.id}@virgule`,
    title: t("title", { name: roomName, topic: theme.title }),
    description: t("description", { topic: theme.title }),
    dates: theme.calendar,
    stamp: now,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(roomName, now, await getTimeZone())}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
