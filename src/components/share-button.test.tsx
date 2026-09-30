import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ShareButton } from "./share-button";

const props = { path: "/r/abc", title: "Séance", text: "Rejoins-nous", label: "Partager" };

describe("ShareButton", () => {
  afterEach(() => {
    // @ts-expect-error nettoyage du partage simulé
    delete navigator.share;
  });

  it("reste masqué sans partage natif", () => {
    renderUi(<ShareButton {...props} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("partage l'URL absolue quand le navigateur le permet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    renderUi(<ShareButton {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Partager" }));
    expect(share).toHaveBeenCalledWith({ title: "Séance", text: "Rejoins-nous", url: `${window.location.origin}/r/abc` });
  });
});
