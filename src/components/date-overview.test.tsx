import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { DateOverview } from "./date-overview";

const labels = {
  view: "Affichage des périodes",
  timeline: "Frise",
  calendar: "Calendrier",
  period: "Une période retenue",
  overlap: "Recoupement",
  best: "Créneau affiché",
  days: "Jours couverts",
};
const props = {
  periods: [
    { start: "2027-06-10", end: "2027-06-12" },
    { start: "2027-06-11", end: "2027-06-13" },
  ],
  best: { start: "2027-06-11", end: "2027-06-12" },
  locale: "fr",
  labels,
};

describe("DateOverview", () => {
  it("montre d'abord la frise, un jour par colonne", () => {
    renderUi(<DateOverview {...props} />);
    expect(screen.getByRole("radio", { name: "Frise" })).toBeChecked();
    const frise = screen.getByRole("img", { name: "Jours couverts" });
    expect(frise).toHaveTextContent("10111213");
  });

  it("bascule sur le calendrier du mois", async () => {
    renderUi(<DateOverview {...props} />);
    await userEvent.click(screen.getByRole("radio", { name: "Calendrier" }));
    expect(screen.getByText("juin 2027")).toBeInTheDocument();
    // Tous les jours du mois sont affichés.
    expect(screen.getByRole("img", { name: "Jours couverts" })).toHaveTextContent("30");
  });
});
