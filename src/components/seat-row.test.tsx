import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMinus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SeatRow } from "./seat-row";

const labels = { row: "2 participants out of 6", free: "Free seat", you: "you", host: "is hosting" };
const seats = [
  { id: "1", name: "Camille", isHost: true },
  { id: "2", name: "sasha", isMe: true },
];

describe("SeatRow", () => {
  it("shows as many seats as capacity, with initial and role", () => {
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} />);
    expect(screen.getByRole("list", { name: labels.row }).children).toHaveLength(6);
    expect(screen.getByLabelText("Camille · is hosting")).toHaveTextContent("C");
    expect(screen.getByLabelText("sasha · you")).toHaveTextContent("S");
    expect(screen.getAllByLabelText("Free seat")).toHaveLength(4);
  });

  it("makes free seats clickable only when an action is provided", async () => {
    const { unmount } = renderUi(<SeatRow seats={seats} capacity={6} labels={labels} />);
    expect(screen.queryAllByRole("button", { name: "Free seat" })).toHaveLength(0);
    unmount();

    const onFreeSeatClick = vi.fn();
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} onFreeSeatClick={onFreeSeatClick} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Free seat" })[0]);
    expect(onFreeSeatClick).toHaveBeenCalledOnce();
  });

  it("opens a taken seat's menu on right click and passes on the chosen action", async () => {
    const onSelect = vi.fn();
    const menu = {
      label: (seat: { name: string }) => `${seat.name}'s seat: options`,
      actions: (seat: { isMe?: boolean }) =>
        seat.isMe ? [] : [{ id: "remove", label: "Remove from the session", icon: UserMinus, destructive: true }],
      onSelect,
    };
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} menu={menu} />);
    // No menu on your own seat.
    expect(screen.queryByRole("button", { name: "sasha's seat: options" })).toBeNull();

    await userEvent.pointer({ keys: "[MouseRight]", target: screen.getByRole("button", { name: "Camille's seat: options" }) });
    await userEvent.click(await screen.findByRole("menuitem", { name: "Remove from the session" }));
    expect(onSelect).toHaveBeenCalledWith(seats[0], "remove");
  });

  it("can offer a menu on your own seat only", async () => {
    const onSelect = vi.fn();
    const menu = {
      label: (seat: { name: string }) => `${seat.name}'s seat: options`,
      actions: (seat: { isMe?: boolean }) =>
        seat.isMe ? [{ id: "leave", label: "Leave the session", icon: UserMinus, destructive: true }] : [],
      onSelect,
    };
    renderUi(<SeatRow seats={seats} capacity={6} labels={labels} menu={menu} />);
    expect(screen.queryByRole("button", { name: "Camille's seat: options" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "sasha's seat: options" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Leave the session" }));
    expect(onSelect).toHaveBeenCalledWith(seats[1], "leave");
  });
});
