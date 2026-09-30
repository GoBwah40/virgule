import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { QrCode } from "./qr-code";

describe("QrCode", () => {
  it("dessine un QR code décrit pour les lecteurs d'écran", () => {
    renderUi(<QrCode value="https://virgule.vercel.app/r/abc" label="QR code du lien" />);
    const img = screen.getByRole("img", { name: "QR code du lien" });
    expect(img.tagName.toLowerCase()).toBe("svg");
    expect(img.querySelector("path")).not.toBeNull();
  });
});
