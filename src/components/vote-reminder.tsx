"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  /** When the reminder was sent (ISO 8601), null if none. */
  sentAt: string | null;
  /** Remembers, for this tab, the last reminder already handled (one key per room). */
  storageKey: string;
  /** The reminder concerns this person (they still have something to do). */
  concerned: boolean;
  message: string;
};

function readSeen(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSeen(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode…): the reminder may show again on the next load.
  }
}

/**
 * Shows a reminder sent to the whole group as a toast (announced to screen readers), once per
 * reminder and only to the people it concerns. Renders nothing: the others never know.
 */
export function VoteReminder({ sentAt, storageKey, concerned, message }: Props) {
  useEffect(() => {
    if (!sentAt || readSeen(storageKey) === sentAt) return;
    // Handled even when it does not concern this person: voting later does not bring it back.
    writeSeen(storageKey, sentAt);
    if (concerned) toast.message(message);
  }, [sentAt, storageKey, concerned, message]);

  return null;
}
