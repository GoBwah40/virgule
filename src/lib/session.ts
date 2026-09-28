import "server-only";

import { cookies } from "next/headers";

import { ROOM_TTL_DAYS } from "@/lib/config";

// Pas de compte : chaque participant reçoit un token secret, stocké dans un cookie
// httpOnly propre à la room. Il permet de revenir dans la room sans reprendre de place.

const cookieName = (slug: string) => `virgule_${slug}`;

export async function getParticipantToken(slug: string): Promise<string | undefined> {
  return (await cookies()).get(cookieName(slug))?.value;
}

export async function setParticipantToken(slug: string, token: string) {
  (await cookies()).set(cookieName(slug), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ROOM_TTL_DAYS * 24 * 60 * 60,
  });
}
