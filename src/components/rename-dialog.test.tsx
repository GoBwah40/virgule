import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { RenameDialog } from "./rename-dialog";

const labels = { trigger: "Rename the session", title: "Rename the session", field: "Session name", submit: "Rename", close: "Close" };

describe("RenameDialog", () => {
  it("opens with the current name and saves the trimmed new one", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderUi(<RenameDialog value="Friday night" maxLength={80} labels={labels} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Rename the session" }));
    const field = await screen.findByLabelText("Session name");
    expect(field).toHaveValue("Friday night");
    await user.clear(field);
    await user.type(field, "  Saturday lunch  ");
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(onSubmit).toHaveBeenCalledWith("Saturday lunch", expect.any(Function));
  });

  it("closes once saved", async () => {
    const user = userEvent.setup();
    renderUi(<RenameDialog value="Friday night" maxLength={80} labels={labels} onSubmit={(_, done) => done()} />);
    await user.click(screen.getByRole("button", { name: "Rename the session" }));
    await user.type(await screen.findByLabelText("Session name"), "!");
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(screen.queryByLabelText("Session name")).toBeNull();
  });

  it("cannot save an empty or unchanged name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderUi(<RenameDialog value="Friday night" maxLength={80} labels={labels} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Rename the session" }));
    const submit = await screen.findByRole("button", { name: "Rename" });
    expect(submit).toBeDisabled();
    const field = screen.getByLabelText("Session name");
    await user.clear(field);
    await user.type(field, "   ");
    expect(submit).toBeDisabled();
    await user.type(field, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the length limit of the field", async () => {
    const user = userEvent.setup();
    renderUi(<RenameDialog value="Friday night" maxLength={80} labels={labels} onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Rename the session" }));
    expect(await screen.findByLabelText("Session name")).toHaveAttribute("maxlength", "80");
  });

  it("stays disabled while saving", async () => {
    const user = userEvent.setup();
    renderUi(<RenameDialog value="Friday night" maxLength={80} labels={labels} pending onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Rename the session" }));
    await user.type(await screen.findByLabelText("Session name"), "!");
    expect(screen.getByRole("button", { name: "Rename" })).toBeDisabled();
  });
});
