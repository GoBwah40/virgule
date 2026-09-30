import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { QrCode } from "./qr-code";

describe("QrCode", () => {
  it("draws a QR code described for screen readers", () => {
    renderUi(<QrCode value="https://virgule.vercel.app/r/abc" label="QR code for the link" />);
    const img = screen.getByRole("img", { name: "QR code for the link" });
    expect(img.tagName.toLowerCase()).toBe("svg");
    expect(img.querySelector("path")).not.toBeNull();
  });
});
