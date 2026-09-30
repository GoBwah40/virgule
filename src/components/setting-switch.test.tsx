import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SettingSwitch } from "./setting-switch";

describe("SettingSwitch", () => {
  it("toggles the setting", async () => {
    const onCheckedChange = vi.fn();
    renderUi(<SettingSwitch id="s" label="Vote on your own ideas" checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
