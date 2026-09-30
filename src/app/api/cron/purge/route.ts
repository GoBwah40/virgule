import { db } from "@/lib/db";

/**
 * Deletes expired rooms (and, by cascade, participants, themes, ideas, votes).
 * Called daily by Vercel Cron (see vercel.json), authenticated with CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { count } = await db.room.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return Response.json({ deleted: count });
}
