import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { DateOverview } from "./date-overview";

const labels = {
  view: "Period view",
  timeline: "Timeline",
  calendar: "Calendar",
  period: "A period kept",
  overlap: "Overlap",
  best: "Slot shown",
  days: "Days covered",
};
const props = {
  periods: [
    { start: "2027-06-10", end: "2027-06-12" },
    { start: "2027-06-11", end: "2027-06-13" },
  ],
  best: { start: "2027-06-11", end: "2027-06-12" },
  locale: "en",
  labels,
};

describe("DateOverview", () => {
  it("shows the timeline first, one day per column", () => {
    renderUi(<DateOverview {...props} />);
    expect(screen.getByRole("radio", { name: "Timeline" })).toBeChecked();
    const timeline = screen.getByRole("img", { name: "Days covered" });
    expect(timeline).toHaveTextContent("10111213");
  });

  it("switches to the month calendar", async () => {
    renderUi(<DateOverview {...props} />);
    await userEvent.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(screen.getByText("June 2027")).toBeInTheDocument();
    // Every day of the month is shown.
    expect(screen.getByRole("img", { name: "Days covered" })).toHaveTextContent("30");
  });
});
