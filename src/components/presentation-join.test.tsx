import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationJoin } from "./presentation-join";

describe("PresentationJoin", () => {
  it("shows a code for the absolute invite link, with its caption", () => {
    renderUi(<PresentationJoin path="/r/abc123" label="Scan to join" qrLabel="QR code for the invite link" />);
    expect(screen.getByRole("img", { name: "QR code for the invite link" })).toBeVisible();
    expect(screen.getByRole("figure")).toHaveTextContent("Scan to join");
  });

  it("comes in a smaller size for a corner of the screen", () => {
    renderUi(<PresentationJoin path="/r/abc123" label="Scan to join" qrLabel="QR code" size="sm" />);
    expect(screen.getByRole("figure")).toHaveClass("stage-xs");
  });
});
