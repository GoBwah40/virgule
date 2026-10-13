"use client";

import { useState } from "react";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** A choice made by this person (layout, topic form…), kept in a cookie for every step and the next visits. */
export function useCookiePreference<T extends string>(cookie: string, initial: T) {
  const [value, setValue] = useState(initial);
  const choose = (next: T) => {
    setValue(next);
    document.cookie = `${cookie}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  };
  return [value, choose] as const;
}
