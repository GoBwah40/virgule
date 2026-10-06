import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { VoteReminder } from "./vote-reminder";

const KEY = "virgule:nudge:abc";
const SENT = "2026-10-06T16:00:00.000Z";

describe("VoteReminder", () => {
  let show: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    sessionStorage.clear();
    show = vi.spyOn(toast, "message").mockImplementation(() => 1);
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows a new reminder to someone it concerns", () => {
    renderUi(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Sam reminds the group" />);
    expect(show).toHaveBeenCalledWith("Sam reminds the group");
  });

  it("shows each reminder only once", () => {
    const { rerender } = renderUi(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Reminder" />);
    rerender(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Reminder" />);
    renderUi(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Reminder" />);
    expect(show).toHaveBeenCalledOnce();
  });

  it("shows nothing to someone who has voted everywhere, even after", () => {
    const { rerender } = renderUi(<VoteReminder sentAt={SENT} storageKey={KEY} concerned={false} message="Reminder" />);
    rerender(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Reminder" />);
    expect(show).not.toHaveBeenCalled();
  });

  it("shows nothing without a reminder", () => {
    renderUi(<VoteReminder sentAt={null} storageKey={KEY} concerned message="Reminder" />);
    expect(show).not.toHaveBeenCalled();
  });

  it("still shows the reminder when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    renderUi(<VoteReminder sentAt={SENT} storageKey={KEY} concerned message="Reminder" />);
    expect(show).toHaveBeenCalledOnce();
  });
});
