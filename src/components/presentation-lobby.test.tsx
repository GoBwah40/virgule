import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationLobby } from "./presentation-lobby";

describe("PresentationLobby", () => {
  it("shows the session name, what happens now and the code to join", () => {
    renderUi(<PresentationLobby title="Team retreat" note="Sam is preparing the topics." join={<p>QR</p>} />);
    expect(screen.getByText("Team retreat")).toBeVisible();
    expect(screen.getByText("Sam is preparing the topics.")).toBeVisible();
    expect(screen.getByText("QR")).toBeVisible();
  });
});

describe("PresentationLobby, long name", () => {
  it("sets a long name a size down", () => {
    renderUi(<PresentationLobby title={"W".repeat(80)} note="Sam is preparing the topics." join={null} />);
    expect(screen.getByText("W".repeat(80))).toHaveClass("stage-lg");
  });
});
