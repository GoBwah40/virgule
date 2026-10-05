import "server-only";

import { cookies } from "next/headers";

import { ROOM_TTL_DAYS } from "@/lib/config";

// No accounts: each participant gets a secret token, stored in an httpOnly cookie
// specific to the room. It lets them come back to the room without taking another seat.

const cookieName = (slug: string) => `virgule_${slug}`;
// The room screen paired by the host (TV, projector) gets a secret of its own: it is no participant.
const screenCookieName = (slug: string) => `virgule_screen_${slug}`;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ROOM_TTL_DAYS * 24 * 60 * 60,
} as const;

export async function getParticipantToken(slug: string): Promise<string | undefined> {
  return (await cookies()).get(cookieName(slug))?.value;
}

export async function setParticipantToken(slug: string, token: string) {
  (await cookies()).set(cookieName(slug), token, cookieOptions);
}

export async function clearParticipantToken(slug: string) {
  (await cookies()).delete(cookieName(slug));
}

export async function getScreenToken(slug: string): Promise<string | undefined> {
  return (await cookies()).get(screenCookieName(slug))?.value;
}

export async function setScreenToken(slug: string, token: string) {
  (await cookies()).set(screenCookieName(slug), token, cookieOptions);
}
