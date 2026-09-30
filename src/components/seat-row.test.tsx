import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMinus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SeatRow } from "./seat-row";

const labels = { row: "2 participants sur 6", free: "Place libre", you: "toi", host: "anime la séance" };
const seats = [
  { id: "1", name: "Camille", isHost: true },
  { id: "2", name: "sacha", isMe: true },
];

describe("SeatRow", () => {
  it("affiche autant de sièges que de places, avec initiale et rôle", () => {
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} />);
    expect(screen.getByRole("list", { name: labels.row }).children).toHaveLength(6);
    expect(screen.getByLabelText("Camille · anime la séance")).toHaveTextContent("C");
    expect(screen.getByLabelText("sacha · toi")).toHaveTextContent("S");
    expect(screen.getAllByLabelText("Place libre")).toHaveLength(4);
  });

  it("rend les places libres cliquables seulement si une action est fournie", async () => {
    const { unmount } = renderUi(<SeatRow seats={seats} capacity={6} labels={labels} />);
    expect(screen.queryAllByRole("button", { name: "Place libre" })).toHaveLength(0);
    unmount();

    const onFreeSeatClick = vi.fn();
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} onFreeSeatClick={onFreeSeatClick} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Place libre" })[0]);
    expect(onFreeSeatClick).toHaveBeenCalledOnce();
  });

  it("ouvre le menu d'une place occupée au clic droit et transmet l'action choisie", async () => {
    const onSelect = vi.fn();
    const menu = {
      label: (seat: { name: string }) => `Place de ${seat.name} : options`,
      actions: (seat: { isMe?: boolean }) =>
        seat.isMe ? [] : [{ id: "remove", label: "Retirer de la séance", icon: UserMinus, destructive: true }],
      onSelect,
    };
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} menu={menu} />);
    // Pas de menu sur sa propre place.
    expect(screen.queryByRole("button", { name: "Place de sacha : options" })).toBeNull();

    await userEvent.pointer({ keys: "[MouseRight]", target: screen.getByRole("button", { name: "Place de Camille : options" }) });
    await userEvent.click(await screen.findByRole("menuitem", { name: "Retirer de la séance" }));
    expect(onSelect).toHaveBeenCalledWith(seats[0], "remove");
  });
});
