import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { SettingsDialog } from "./settings-dialog";

const labels = { trigger: "Open the settings", title: "Settings", close: "Close" };

describe("SettingsDialog", () => {
  it("keeps the settings out of the page until the gear button is pressed", async () => {
    const user = userEvent.setup();
    renderUi(
      <SettingsDialog labels={labels}>
        <label>
          <input type="checkbox" /> Comments on ideas
        </label>
      </SettingsDialog>,
    );
    expect(screen.queryByLabelText("Comments on ideas")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open the settings" }));
    expect(await screen.findByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByLabelText("Comments on ideas")).toBeInTheDocument();
  });

  it("closes with its close button", async () => {
    const user = userEvent.setup();
    renderUi(<SettingsDialog labels={labels}>Nothing yet</SettingsDialog>);
    await user.click(screen.getByRole("button", { name: "Open the settings" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
