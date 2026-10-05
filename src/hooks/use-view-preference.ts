"use client";

import { useState } from "react";

import { VIEW_COOKIE, type ViewPreference } from "@/lib/view-preference";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** The layout picked by this person, kept in a cookie for every step and the next visits. */
export function useViewPreference(initial: ViewPreference) {
  const [view, setView] = useState(initial);
  const choose = (next: ViewPreference) => {
    setView(next);
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  };
  return [view, choose] as const;
}
