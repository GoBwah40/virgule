import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "TEXT", label: "Texte" },
  { value: "DATE", label: "Date" },
];

describe("SegmentedControl", () => {
  it("expose un groupe de boutons radio et signale le choix", async () => {
    const onChange = vi.fn();
    renderUi(<SegmentedControl name="kind" label="Type de réponse" options={options} value="TEXT" onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Type de réponse" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Texte" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Date" }));
    expect(onChange).toHaveBeenCalledWith("DATE");
  });

  it("bloque le choix quand il est désactivé", async () => {
    const onChange = vi.fn();
    renderUi(<SegmentedControl name="kind" label="Type" options={options} value="TEXT" onChange={onChange} disabled hint="Verrouillé" />);
    expect(screen.getByRole("radio", { name: "Date" })).toBeDisabled();
    expect(screen.getByText("Verrouillé")).toBeInTheDocument();
  });
});
