import { db } from "@/lib/db";

/**
 * Supprime les rooms expirées (et, en cascade, participants, thèmes, idées, votes).
 * Appelée chaque jour par Vercel Cron (cf. vercel.json), authentifiée par CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { count } = await db.room.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return Response.json({ deleted: count });
}
