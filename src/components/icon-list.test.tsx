import { screen } from "@testing-library/react";
import { Tags } from "lucide-react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { IconList } from "./icon-list";

describe("IconList", () => {
  it("shows one row per item", () => {
    renderUi(
      <IconList
        items={[
          { icon: Tags, text: "You pick the topics" },
          { icon: Tags, text: "Everyone votes" },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Everyone votes")).toBeInTheDocument();
  });
});
