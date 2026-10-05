import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationSeats } from "./presentation-seats";

describe("PresentationSeats", () => {
  it("shows one seat per place, the taken ones with their initial", () => {
    renderUi(
      <PresentationSeats
        capacity={6}
        label="2 seats out of 6 taken"
        seats={[
          { id: "1", name: "camille" },
          { id: "2", name: "Noah" },
        ]}
      />,
    );
    expect(screen.getByText("2 seats out of 6 taken")).toBeVisible();
    const seats = screen.getAllByRole("listitem", { hidden: true });
    expect(seats).toHaveLength(6);
    expect(seats[0]).toHaveTextContent("C");
    // The first name for screen readers, the free seats left out.
    expect(screen.getAllByRole("listitem").map((seat) => seat.textContent)).toEqual(["Ccamille", "NNoah"]);
  });
});

describe("PresentationSeats, a large group", () => {
  it("wraps its 12 seats rather than overflowing a narrow screen", () => {
    renderUi(<PresentationSeats capacity={12} label="1 seat out of 12 taken" seats={[{ id: "1", name: "Camille" }]} />);
    expect(screen.getAllByRole("listitem", { hidden: true })).toHaveLength(12);
    expect(screen.getAllByRole("list", { hidden: true })[0]).toHaveClass("flex-wrap");
  });
});
