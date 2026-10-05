import { createHash, randomInt } from "node:crypto";

// One-time code pairing a room screen (TV, projector) with a session: shown on the host's phone,
// typed on the screen. Short enough to type with a remote or a keyboard, unambiguous to read out
// loud (no 0/O, 1/I/L), and only its hash is stored.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const SCREEN_CODE_LENGTH = 6;

/** A new random code, e.g. "K7QM3X". */
export function newScreenCode(): string {
  return Array.from({ length: SCREEN_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** What was typed, as a code: case, spaces and dashes ignored; null if it cannot be one. */
export function normalizeScreenCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== SCREEN_CODE_LENGTH) return null;
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null;
}

/** Stored form of a code: a database leak does not give working codes away. */
export function hashScreenCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
