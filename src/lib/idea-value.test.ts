import { describe, expect, it } from "vitest";

import { describeIdea, ideaKey, mapSearchUrl, parseChoiceOptions, readChoiceOptions, isIsoDate, MAX_AMOUNT, parseIdeaInput, rangeStartPrecision, withFirstOrdinal, type IdeaFields } from "@/lib/idea-value";

const format = {
  date: (iso: string) => `date(${iso})`,
  dateRange: (a: string, b: string) => `Du ${a} au ${b}`,
  amount: (n: number) => `${n} €`,
  amountRange: (a: number, b: number) => `De ${a} € à ${b} €`,
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
      "Du 2027-06-12 au 2027-06-14",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 300, amountMax: 500 }), format)).toBe("De 300 € à 500 €");
  });

  it("une période d'un jour ou une fourchette égale s'affiche comme une valeur simple", () => {
    expect(describeIdea("DATE_RANGE", fields({ dateStart: "2027-06-12", dateEnd: "2027-06-12" }), format)).toBe(
      "date(2027-06-12)",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 400, amountMax: 400 }), format)).toBe("400 €");
  });
});

describe("rangeStartPrecision", () => {
  it("n'affiche que le jour de début dans le même mois", () => {
    expect(rangeStartPrecision("2027-06-12", "2027-06-14")).toBe("day");
  });
  it("ajoute le mois quand il change dans la même année", () => {
    expect(rangeStartPrecision("2027-06-28", "2027-07-02")).toBe("dayMonth");
  });
  it("donne la date complète quand l'année change", () => {
    expect(rangeStartPrecision("2027-12-30", "2028-01-02")).toBe("full");
  });
});

describe("withFirstOrdinal", () => {
  it("écrit le premier du mois « 1er »", () => {
    expect(withFirstOrdinal("1 octobre 2026")).toBe("1er octobre 2026");
    expect(withFirstOrdinal("1")).toBe("1er");
  });
  it("laisse les autres jours intacts", () => {
    expect(withFirstOrdinal("10 octobre 2026")).toBe("10 octobre 2026");
    expect(withFirstOrdinal("21 octobre 2026")).toBe("21 octobre 2026");
  });
});

describe("ideaKey", () => {
  it("ignore casse, accents, ponctuation et espaces pour le texte", () => {
    expect(ideaKey("TEXT", fields({ content: "Pique-nique à l'Étang !" }))).toBe(
      ideaKey("TEXT", fields({ content: "  pique nique a l etang" })),
    );
  });
  it("distingue deux textes différents", () => {
    expect(ideaKey("TEXT", fields({ content: "Lyon" }))).not.toBe(ideaKey("TEXT", fields({ content: "Lille" })));
  });
  it("compare les valeurs des sujets typés", () => {
    const a = fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" });
    expect(ideaKey("DATE_RANGE", a)).toBe(ideaKey("DATE_RANGE", { ...a }));
    expect(ideaKey("DATE_RANGE", a)).not.toBe(ideaKey("DATE_RANGE", { ...a, dateEnd: "2027-06-15" }));
    expect(ideaKey("AMOUNT_RANGE", fields({ amountMin: 300, amountMax: 500 }))).toBe("300/500");
  });
});

describe("sujets Lieu et Liste", () => {
  it("valident une proposition comme du texte", () => {
    expect(parseIdeaInput("PLACE", { content: "  Gîte du Vercors " })).toEqual({
      ok: true,
      fields: fields({ content: "Gîte du Vercors" }),
    });
    expect(parseIdeaInput("CHOICE", { content: "" })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("parseChoiceOptions accepte 2 à 10 options distinctes", () => {
    expect(parseChoiceOptions([" Mer ", "Montagne", "Ville"])).toEqual(["Mer", "Montagne", "Ville"]);
    expect(parseChoiceOptions(["Mer"])).toBeNull();
    expect(parseChoiceOptions(["Mer", "mer !"])).toBeNull();
    expect(parseChoiceOptions(["Mer", ""])).toBeNull();
    expect(parseChoiceOptions(Array.from({ length: 11 }, (_, i) => `Option ${i}`))).toBeNull();
    expect(parseChoiceOptions("Mer")).toBeNull();
  });

  it("readChoiceOptions tolère une valeur absente ou illisible", () => {
    expect(readChoiceOptions('["Mer","Ville"]')).toEqual(["Mer", "Ville"]);
    expect(readChoiceOptions(null)).toEqual([]);
    expect(readChoiceOptions("pas du json")).toEqual([]);
  });

  it("mapSearchUrl vise Plans sur Apple, Google Maps ailleurs", () => {
    expect(mapSearchUrl("Gîte, Vercors", true)).toBe("https://maps.apple.com/?q=G%C3%AEte%2C%20Vercors");
    expect(mapSearchUrl("Gîte, Vercors", false)).toBe(
      "https://www.google.com/maps/search/?api=1&query=G%C3%AEte%2C%20Vercors",
    );
  });
});
