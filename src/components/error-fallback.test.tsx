import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ErrorFallback } from "./error-fallback";

const props = {
  title: "Quelque chose n'a pas marché",
  body: "La page n'a pas pu s'afficher.",
  labels: { retry: "Réessayer", home: "Retour à l'accueil" },
};

describe("ErrorFallback", () => {
  it("relance le chargement au clic sur « Réessayer »", async () => {
    const onRetry = vi.fn();
    renderUi(<ErrorFallback {...props} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("propose un retour à l'accueil par rechargement complet et affiche le code d'erreur", () => {
    renderUi(<ErrorFallback {...props} onRetry={() => {}} details="Code d'erreur : 42" />);
    expect(screen.getByRole("button", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Code d'erreur : 42")).toBeInTheDocument();
  });

  it("en mode section, s'insère sous l'en-tête (div + h2, pas de second <main>)", () => {
    const { container } = renderUi(<ErrorFallback {...props} onRetry={() => {}} size="section" />);
    expect(container.querySelector("main")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
  });
});
