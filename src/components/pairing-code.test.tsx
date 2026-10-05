import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PairingCode } from "./pairing-code";

describe("PairingCode", () => {
  it("shows the code in two groups, announced with what it is for", () => {
    renderUi(<PairingCode code="K7QM3X" label="Pairing code" />);
    const code = screen.getByText((_, element) => element?.tagName === "P");
    expect(code).toHaveTextContent("Pairing code K7QM3X");
    expect(screen.getByText("M3X")).toHaveClass("ml-[0.45em]");
  });
});
