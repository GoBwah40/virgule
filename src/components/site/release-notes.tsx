"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { type ReleaseNotesEntry, ReleaseNotesSheet } from "@/components/release-notes-sheet";

// Last version whose notes the person opened, specific to this browser.
const SEEN_KEY = "virgule_release_seen";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Home page release notes: a dot until the live version has been viewed. */
export function ReleaseNotes({ version, releases }: { version: string; releases: ReleaseNotesEntry[] }) {
  const t = useTranslations("releaseNotes");
  // Server-side, we treat it as seen: no dot flashing on load.
  const seen = useSyncExternalStore(subscribe, readSeen, () => version);
  const [openedNow, setOpenedNow] = useState(false);

  const markSeen = (open: boolean) => {
    if (!open) return;
    setOpenedNow(true);
    try {
      localStorage.setItem(SEEN_KEY, version);
    } catch {
      // Storage unavailable (private browsing…): the dot will come back, no big deal.
    }
  };

  return (
    <ReleaseNotesSheet
      version={version}
      releases={releases}
      unread={!openedNow && seen !== version}
      onOpenChange={markSeen}
      labels={{
        trigger: t("trigger"),
        unread: t("unread"),
        title: t("title"),
        description: t("description"),
        close: t("close"),
        latest: t("latest"),
        categories: { added: t("categories.added"), improved: t("categories.improved"), fixed: t("categories.fixed") },
      }}
    />
  );
}
