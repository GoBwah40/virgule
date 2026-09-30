import { describe, expect, it } from "vitest";

import { describeIdea, isIsoDate, MAX_AMOUNT, parseIdeaInput, type IdeaFields } from "@/lib/idea-value";

const format = {
  date: (iso: string) => `date(${iso})`,
  dateRange: (a: string, b: string) => `du ${a} au ${b}`,
  amount: (n: number) => `${n} €`,
  amountRange: (a: number, b: number) => `${a} € à ${b} €`,
};

const fields = (partial: Partial<IdeaFields>): IdeaFields => ({
  content: "",
  dateStart: null,
  dateEnd: null,
  amountMin: null,
  amountMax: null,
  ...partial,
});

describe("isIsoDate", () => {
  it("accepte une vraie date AAAA-MM-JJ", () => {
    expect(isIsoDate("2027-06-12")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("refuse les formats et les dates impossibles", () => {
    expect(isIsoDate("2027-02-31")).toBe(false);
    expect(isIsoDate("12/06/2027")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe("parseIdeaInput", () => {
  it("texte : exige un contenu non vide", () => {
    expect(parseIdeaInput("TEXT", { content: "  Pique-nique  " })).toEqual({ ok: true, fields: fields({ content: "Pique-nique" }) });
    expect(parseIdeaInput("TEXT", { content: "   " })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("période : la fin ne peut pas précéder le début", () => {
    expect(parseIdeaInput("DATE_RANGE", { dateStart: "2027-06-12", dateEnd: "2027-06-14" })).toEqual({
      ok: true,
      fields: fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" }),
    });
    expect(parseIdeaInput("DATE_RANGE", { dateStart: "2027-06-14", dateEnd: "2027-06-12" })).toEqual({
      ok: false,
      error: "invalidDateRange",
    });
  });

  it("montant : entier positif, borné", () => {
    expect(parseIdeaInput("AMOUNT", { amountMin: 250 })).toEqual({ ok: true, fields: fields({ amountMin: 250 }) });
    expect(parseIdeaInput("AMOUNT", { amountMin: -5 })).toEqual({ ok: false, error: "invalidInput" });
    expect(parseIdeaInput("AMOUNT", { amountMin: 12.5 })).toEqual({ ok: false, error: "invalidInput" });
    expect(parseIdeaInput("AMOUNT", { amountMin: MAX_AMOUNT + 1 })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("fourchette : le maximum ne peut pas être sous le minimum", () => {
    expect(parseIdeaInput("AMOUNT_RANGE", { amountMin: 300, amountMax: 500 }).ok).toBe(true);
    expect(parseIdeaInput("AMOUNT_RANGE", { amountMin: 500, amountMax: 300 })).toEqual({ ok: false, error: "invalidAmountRange" });
  });

  it("ignore les champs qui ne correspondent pas au type", () => {
    const res = parseIdeaInput("DATE", { dateStart: "2027-06-12", content: "texte", amountMin: 3 });
    expect(res).toEqual({ ok: true, fields: fields({ dateStart: "2027-06-12" }) });
  });
});

describe("describeIdea", () => {
  it("met en forme selon le type", () => {
    expect(describeIdea("TEXT", fields({ content: "Pique-nique" }), format)).toBe("Pique-nique");
    expect(describeIdea("DATE", fields({ dateStart: "2027-06-12" }), format)).toBe("date(2027-06-12)");
    expect(describeIdea("DATE_RANGE", fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" }), format)).toBe(
      "du 2027-06-12 au 2027-06-14",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 300, amountMax: 500 }), format)).toBe("300 € à 500 €");
  });

  it("une période d'un jour ou une fourchette égale s'affiche comme une valeur simple", () => {
    expect(describeIdea("DATE_RANGE", fields({ dateStart: "2027-06-12", dateEnd: "2027-06-12" }), format)).toBe(
      "date(2027-06-12)",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 400, amountMax: 400 }), format)).toBe("400 €");
  });
});
