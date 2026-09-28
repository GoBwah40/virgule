import { screen } from "@testing-library/react";
import { Tags } from "lucide-react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { IconList } from "./icon-list";

describe("IconList", () => {
  it("affiche une ligne par élément", () => {
    renderUi(
      <IconList
        items={[
          { icon: Tags, text: "Tu choisis les sujets" },
          { icon: Tags, text: "Chacun vote" },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Chacun vote")).toBeInTheDocument();
  });
});
