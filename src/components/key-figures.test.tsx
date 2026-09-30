import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { KeyFigures } from "./key-figures";

describe("KeyFigures", () => {
  it("shows each figure with its label", () => {
    renderUi(
      <KeyFigures
        items={[
          { value: 6, label: "seats" },
          { value: 7, label: "days online" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent("7days online");
  });
});
