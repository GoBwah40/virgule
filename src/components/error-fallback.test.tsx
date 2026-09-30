import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ErrorFallback } from "./error-fallback";

const props = {
  title: "Something went wrong",
  body: "The page couldn't be displayed.",
  labels: { retry: "Try again", home: "Back to home" },
};

describe("ErrorFallback", () => {
  it("reloads when \"Try again\" is clicked", async () => {
    const onRetry = vi.fn();
    renderUi(<ErrorFallback {...props} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("offers a full-reload link back home and shows the error code", () => {
    renderUi(<ErrorFallback {...props} onRetry={() => {}} details="Error code: 42" />);
    expect(screen.getByRole("button", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Error code: 42")).toBeInTheDocument();
  });

  it("in section mode, fits under the header (div + h2, no second <main>)", () => {
    const { container } = renderUi(<ErrorFallback {...props} onRetry={() => {}} size="section" />);
    expect(container.querySelector("main")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
  });
});
