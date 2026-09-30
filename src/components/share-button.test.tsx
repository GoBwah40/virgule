import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ShareButton } from "./share-button";

const props = { path: "/r/abc", title: "Session", text: "Join us", label: "Share" };

describe("ShareButton", () => {
  afterEach(() => {
    // @ts-expect-error cleanup of the mocked share
    delete navigator.share;
  });

  it("stays hidden without native sharing", () => {
    renderUi(<ShareButton {...props} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shares the absolute URL when the browser supports it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    renderUi(<ShareButton {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith({ title: "Session", text: "Join us", url: `${window.location.origin}/r/abc` });
  });
});
