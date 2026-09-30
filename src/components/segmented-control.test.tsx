import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "TEXT", label: "Text" },
  { value: "DATE", label: "Date" },
];

describe("SegmentedControl", () => {
  it("exposes a radio group and reports the choice", async () => {
    const onChange = vi.fn();
    renderUi(<SegmentedControl name="kind" label="Answer type" options={options} value="TEXT" onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Answer type" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Text" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Date" }));
    expect(onChange).toHaveBeenCalledWith("DATE");
  });

  it("blocks the choice when disabled", async () => {
    const onChange = vi.fn();
    renderUi(<SegmentedControl name="kind" label="Type" options={options} value="TEXT" onChange={onChange} disabled hint="Locked" />);
    expect(screen.getByRole("radio", { name: "Date" })).toBeDisabled();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
});
