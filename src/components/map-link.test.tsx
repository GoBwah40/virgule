import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { MapLink } from "./map-link";

describe("MapLink", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens Google Maps on non-Apple devices, in a new tab", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14)");
    renderUi(<MapLink query="Vercors" label="View on the map" />);
    const link = screen.getByRole("link", { name: "View on the map" });
    expect(link).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=Vercors");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("opens Apple Maps on iPhone", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)");
    renderUi(<MapLink query="Vercors" label="View on the map" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://maps.apple.com/?q=Vercors");
  });
});
