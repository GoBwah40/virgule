import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { LoadingState } from "./loading-state";
import { PageHeaderSkeleton } from "./page-header-skeleton";

describe("LoadingState", () => {
  it("annonce le chargement et masque les squelettes aux lecteurs d'écran", () => {
    renderUi(
      <LoadingState label="Chargement des idées…">
        <PageHeaderSkeleton />
      </LoadingState>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Chargement des idées…");
    expect(status.querySelector("[aria-hidden]")).not.toBeNull();
  });
});
