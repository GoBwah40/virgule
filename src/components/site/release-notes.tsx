"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { type ReleaseNotesEntry, ReleaseNotesSheet } from "@/components/release-notes-sheet";

// Dernière version dont la personne a ouvert les notes, propre à ce navigateur.
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

/** Notes de version de l'accueil : pastille tant que la version en ligne n'a pas été consultée. */
export function ReleaseNotes({ version, releases }: { version: string; releases: ReleaseNotesEntry[] }) {
  const t = useTranslations("releaseNotes");
  // Côté serveur, on fait comme si c'était vu : pas de pastille qui clignote au chargement.
  const seen = useSyncExternalStore(subscribe, readSeen, () => version);
  const [openedNow, setOpenedNow] = useState(false);

  const markSeen = (open: boolean) => {
    if (!open) return;
    setOpenedNow(true);
    try {
      localStorage.setItem(SEEN_KEY, version);
    } catch {
      // Stockage indisponible (navigation privée…) : la pastille reviendra, sans gravité.
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
