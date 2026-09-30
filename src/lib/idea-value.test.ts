import { describe, expect, it } from "vitest";

import { describeIdea, ideaKey, mapSearchUrl, parseChoiceOptions, readChoiceOptions, isIsoDate, MAX_AMOUNT, parseIdeaInput, rangeStartPrecision, withFirstOrdinal, type IdeaFields } from "@/lib/idea-value";

const format = {
  date: (iso: string) => `date(${iso})`,
  dateRange: (a: string, b: string) => `From ${a} to ${b}`,
  amount: (n: number) => `€${n}`,
  amountRange: (a: number, b: number) => `€${a} to €${b}`,
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
  it("accepts a real YYYY-MM-DD date", () => {
    expect(isIsoDate("2027-06-12")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("rejects other formats and impossible dates", () => {
    expect(isIsoDate("2027-02-31")).toBe(false);
    expect(isIsoDate("12/06/2027")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe("parseIdeaInput", () => {
  it("text: requires non-empty content", () => {
    expect(parseIdeaInput("TEXT", { content: "  Picnic  " })).toEqual({ ok: true, fields: fields({ content: "Picnic" }) });
    expect(parseIdeaInput("TEXT", { content: "   " })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("period: the end cannot come before the start", () => {
    expect(parseIdeaInput("DATE_RANGE", { dateStart: "2027-06-12", dateEnd: "2027-06-14" })).toEqual({
      ok: true,
      fields: fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" }),
    });
    expect(parseIdeaInput("DATE_RANGE", { dateStart: "2027-06-14", dateEnd: "2027-06-12" })).toEqual({
      ok: false,
      error: "invalidDateRange",
    });
  });

  it("amount: positive integer, bounded", () => {
    expect(parseIdeaInput("AMOUNT", { amountMin: 250 })).toEqual({ ok: true, fields: fields({ amountMin: 250 }) });
    expect(parseIdeaInput("AMOUNT", { amountMin: -5 })).toEqual({ ok: false, error: "invalidInput" });
    expect(parseIdeaInput("AMOUNT", { amountMin: 12.5 })).toEqual({ ok: false, error: "invalidInput" });
    expect(parseIdeaInput("AMOUNT", { amountMin: MAX_AMOUNT + 1 })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("range: the maximum cannot be below the minimum", () => {
    expect(parseIdeaInput("AMOUNT_RANGE", { amountMin: 300, amountMax: 500 }).ok).toBe(true);
    expect(parseIdeaInput("AMOUNT_RANGE", { amountMin: 500, amountMax: 300 })).toEqual({ ok: false, error: "invalidAmountRange" });
  });

  it("ignores fields that do not match the kind", () => {
    const res = parseIdeaInput("DATE", { dateStart: "2027-06-12", content: "text", amountMin: 3 });
    expect(res).toEqual({ ok: true, fields: fields({ dateStart: "2027-06-12" }) });
  });
});

describe("describeIdea", () => {
  it("formats according to the kind", () => {
    expect(describeIdea("TEXT", fields({ content: "Picnic" }), format)).toBe("Picnic");
    expect(describeIdea("DATE", fields({ dateStart: "2027-06-12" }), format)).toBe("date(2027-06-12)");
    expect(describeIdea("DATE_RANGE", fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" }), format)).toBe(
      "From 2027-06-12 to 2027-06-14",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 300, amountMax: 500 }), format)).toBe("€300 to €500");
  });

  it("shows a one-day period or an equal range as a single value", () => {
    expect(describeIdea("DATE_RANGE", fields({ dateStart: "2027-06-12", dateEnd: "2027-06-12" }), format)).toBe(
      "date(2027-06-12)",
    );
    expect(describeIdea("AMOUNT_RANGE", fields({ amountMin: 400, amountMax: 400 }), format)).toBe("€400");
  });
});

describe("rangeStartPrecision", () => {
  it("shows only the start day within the same month", () => {
    expect(rangeStartPrecision("2027-06-12", "2027-06-14")).toBe("day");
  });
  it("adds the month when it changes within the same year", () => {
    expect(rangeStartPrecision("2027-06-28", "2027-07-02")).toBe("dayMonth");
  });
  it("gives the full date when the year changes", () => {
    expect(rangeStartPrecision("2027-12-30", "2028-01-02")).toBe("full");
  });
});

describe("withFirstOrdinal", () => {
  it("writes the first of the month \"1er\" in French", () => {
    expect(withFirstOrdinal("1 octobre 2026")).toBe("1er octobre 2026");
    expect(withFirstOrdinal("1")).toBe("1er");
  });
  it("leaves other French days untouched", () => {
    expect(withFirstOrdinal("10 octobre 2026")).toBe("10 octobre 2026");
    expect(withFirstOrdinal("21 octobre 2026")).toBe("21 octobre 2026");
  });
});

describe("ideaKey", () => {
  it("ignores case, accents, punctuation and spaces in text (French sample)", () => {
    expect(ideaKey("TEXT", fields({ content: "Pique-nique à l'Étang !" }))).toBe(
      ideaKey("TEXT", fields({ content: "  pique nique a l etang" })),
    );
  });
  it("tells two different texts apart", () => {
    expect(ideaKey("TEXT", fields({ content: "Lyon" }))).not.toBe(ideaKey("TEXT", fields({ content: "Lille" })));
  });
  it("compares the values of typed topics", () => {
    const a = fields({ dateStart: "2027-06-12", dateEnd: "2027-06-14" });
    expect(ideaKey("DATE_RANGE", a)).toBe(ideaKey("DATE_RANGE", { ...a }));
    expect(ideaKey("DATE_RANGE", a)).not.toBe(ideaKey("DATE_RANGE", { ...a, dateEnd: "2027-06-15" }));
    expect(ideaKey("AMOUNT_RANGE", fields({ amountMin: 300, amountMax: 500 }))).toBe("300/500");
  });
});

describe("Place and List topics", () => {
  it("validate a suggestion as text", () => {
    expect(parseIdeaInput("PLACE", { content: "  Lake District cottage " })).toEqual({
      ok: true,
      fields: fields({ content: "Lake District cottage" }),
    });
    expect(parseIdeaInput("CHOICE", { content: "" })).toEqual({ ok: false, error: "invalidInput" });
  });

  it("parseChoiceOptions accepts 2 to 10 distinct options", () => {
    expect(parseChoiceOptions([" Sea ", "Mountains", "City"])).toEqual(["Sea", "Mountains", "City"]);
    expect(parseChoiceOptions(["Sea"])).toBeNull();
    expect(parseChoiceOptions(["Sea", "sea !"])).toBeNull();
    expect(parseChoiceOptions(["Sea", ""])).toBeNull();
    expect(parseChoiceOptions(Array.from({ length: 11 }, (_, i) => `Option ${i}`))).toBeNull();
    expect(parseChoiceOptions("Sea")).toBeNull();
  });

  it("readChoiceOptions tolerates a missing or unreadable value", () => {
    expect(readChoiceOptions('["Sea","City"]')).toEqual(["Sea", "City"]);
    expect(readChoiceOptions(null)).toEqual([]);
    expect(readChoiceOptions("not json")).toEqual([]);
  });

  it("mapSearchUrl targets Apple Maps on Apple, Google Maps elsewhere", () => {
    expect(mapSearchUrl("Gîte, Vercors", true)).toBe("https://maps.apple.com/?q=G%C3%AEte%2C%20Vercors");
    expect(mapSearchUrl("Gîte, Vercors", false)).toBe(
      "https://www.google.com/maps/search/?api=1&query=G%C3%AEte%2C%20Vercors",
    );
  });
});
