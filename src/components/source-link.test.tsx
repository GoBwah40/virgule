import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { SourceLink } from "./source-link";

describe("SourceLink", () => {
  it("opens the repository in a new tab", () => {
    renderUi(<SourceLink href="https://github.com/GoBwah40/virgule" label="Source code" />);
    const link = screen.getByRole("link", { name: "Source code" });
    expect(link).toHaveAttribute("href", "https://github.com/GoBwah40/virgule");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
