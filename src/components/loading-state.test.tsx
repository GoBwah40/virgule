import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { LoadingState } from "./loading-state";
import { PageHeaderSkeleton } from "./page-header-skeleton";

describe("LoadingState", () => {
  it("announces loading and hides the skeletons from screen readers", () => {
    renderUi(
      <LoadingState label="Loading ideas…">
        <PageHeaderSkeleton />
      </LoadingState>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading ideas…");
    expect(status.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("shows the turning rosette on a veil over the skeletons", () => {
    renderUi(
      <LoadingState label="Loading ideas…">
        <PageHeaderSkeleton />
      </LoadingState>,
    );
    const veil = screen.getByRole("status").querySelector(".loading-veil");
    expect(veil).toHaveClass("bg-scrim");
    expect(veil?.querySelector("svg")).toHaveClass("motion-safe:animate-rosette-turn");
    expect(veil?.querySelectorAll("path")).toHaveLength(6);
  });
});
