import { screen } from "@testing-library/react";
import { CalendarRange } from "lucide-react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { IconBadge } from "./icon-badge";

describe("IconBadge", () => {
  it("shows the label, the icon staying decorative", () => {
    const { container } = renderUi(<IconBadge icon={CalendarRange} label="Period" />);
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
