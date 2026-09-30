import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { MapLink } from "./map-link";

describe("MapLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("ouvre Google Maps hors appareils Apple, dans un nouvel onglet", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14)");
    renderUi(<MapLink query="Vercors" label="Voir sur la carte" />);
    const link = screen.getByRole("link", { name: "Voir sur la carte" });
    expect(link).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=Vercors");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("ouvre Plans sur iPhone", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)");
    renderUi(<MapLink query="Vercors" label="Voir sur la carte" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://maps.apple.com/?q=Vercors");
  });
});
