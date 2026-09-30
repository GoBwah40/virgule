import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { StatusPage } from "./status-page";

describe("StatusPage", () => {
  it("shows the message and the suggested action", () => {
    renderUi(
      <StatusPage title="Session not found" body="The link may be incomplete.">
        <button type="button">Try again</button>
      </StatusPage>,
    );
    expect(screen.getByRole("heading", { name: "Session not found" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
